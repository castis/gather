from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify
from flask_jwt_extended import (
    create_access_token,
    current_user,
    jwt_required,
    set_access_cookies,
    unset_jwt_cookies,
)
from gather.mail import send_password_reset_email
from gather.models import RelationshipType, User, db, user_relationship
from gather.routes import limiter
from gather.schemas import me_schema, user_schema
from gather.utils import cache
from gather.validators import password_complexity
from marshmallow import Schema, fields, post_load
from webargs import ValidationError, fields
from webargs.flaskparser import use_kwargs

api = Blueprint("auth", __name__, url_prefix="/auth")


class LoginRequest(Schema):
    name = fields.Str(required=True)
    password = fields.Str(required=True)

    @post_load
    def validate_user(self, data, **kwargs):
        if (
            (user := User.query.filter_by(name=data["name"]).one_or_none())
            and not user.banned
            and user.check_password(data["password"])
        ):
            return dict(user=user)

        raise ValidationError({"name": user.banned_reason or "Nah"})


@api.route("login", methods=["POST"])
@limiter.limit("5 per minute")
@use_kwargs(LoginRequest(), location="json")
def login(user):
    access_token = create_access_token(identity=user)
    response = jsonify(me_schema.dump(user))
    set_access_cookies(response, access_token)
    return response, 200


@api.route("logout", methods=["POST"])
def logout():
    response = jsonify()
    unset_jwt_cookies(response)
    return response, 204


class ForgotPasswordRequest(Schema):
    email = fields.Email(required=True)

    @post_load
    def validate_form(self, data, **kwargs):
        user = User.query.filter_by(email=data.get("email")).first()

        if not user:
            raise ValidationError({"email": "Never heard of you"})

        if user.banned:
            raise ValidationError({"email": user.banned_reason or "Nah"})

        return dict(user=user)


@api.route("forgot", methods=["POST"])
@limiter.limit("3 per minute")
@use_kwargs(ForgotPasswordRequest)
def forgot(user):
    user.password_reset_token = User.generate_password_reset_token()
    user.password_reset_sent_at = datetime.now(timezone.utc)

    db.session.add(user)
    db.session.commit()

    send_password_reset_email(user)

    return "", 204


class ResetPasswordRequest(Schema):
    token = fields.Str(required=True)
    password = fields.Str(required=True)
    confirmation = fields.Str(required=True)

    @post_load
    def validate_form(self, data, **kwargs):
        token = data.get("token")
        password = data.get("password")
        confirmation = data.get("confirmation")

        user = User.query.filter_by(password_reset_token=token).first()

        if not user:
            raise ValidationError({"token": "Invalid code"})

        if user.banned:
            raise ValidationError({"token": user.banned_reason or "Nah"})

        if not password_complexity(password):
            raise ValidationError({"password": "not complex enough"})

        if password != confirmation:
            raise ValidationError({"confirmation": "passwords must match"})
    
        return dict(
            user=user,
            password=password,
        )


@api.route("set_password", methods=["POST"])
@limiter.limit("2 per minute")
@use_kwargs(ResetPasswordRequest())
def reset(user, password):
    user.set_password(password)
    user.password_reset_token = None
    user.password_reset_sent_at = None

    db.session.add(user)
    db.session.commit()

    return "", 204


class VerifyEmailRequest(Schema):
    token = fields.Str(required=True)

    @post_load
    def validate_form(self, data, **kwargs):
        token = data.get("token")

        if not token:
            raise ValidationError({"token": "Invalid token"})

        user = User.query.filter_by(email_reset_token=token).first()

        if not user:
            raise ValidationError({"token": "Invalid token"})

        return dict(user=user)

@api.route("verify_email", methods=["POST"])
@limiter.limit("2 per minute")
@use_kwargs(VerifyEmailRequest())
def verify_email(user):
    user.email_reset_token= None
    user.email_reset_sent_at = None

    db.session.add(user)
    db.session.commit()

    return "", 204


# @cache.cached(timeout=60 * 2, key_prefix="get_buddies")
def get_buddies(user_id):
    buddies = (
        db.session.query(User)
        .join(user_relationship, User.id == user_relationship.c.related_id)
        .filter(
            user_relationship.c.type == RelationshipType.buddy,
            user_relationship.c.user_id == user_id,
            User.last_seen_at
            >= datetime.now(timezone.utc) - timedelta(minutes=15),
        )
        .all()
    )

    return [user_schema.dump(buddy) for buddy in buddies]


@cache.cached(timeout=60 * 1, key_prefix="buddies_count")
def buddies_count(user_id):
    return (
        db.session.query(User)
        .join(user_relationship, User.id == user_relationship.c.related_id)
        .filter(
            user_relationship.c.type == RelationshipType.buddy,
            user_relationship.c.user_id == user_id,
        )
        .count()
    )


@api.route("ping", methods=["POST"])
@jwt_required()
def ping():
    if current_user.banned is True:
        return {
            "banned": True,
            "reason": current_user.banned_reason,
        }, 403

    return {
        "user": me_schema.dump(current_user),
        "buddies": {
            "online": get_buddies(current_user.id),
            "total": buddies_count(current_user.id),
        },
    }, 200
