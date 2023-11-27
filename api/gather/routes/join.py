import json

from flask import Blueprint
from gather.config import URL
from gather.legacy.services import YH3
from gather.mail import send_password_reset_email
from gather.models import Applicant, User, db
from gather.routes import limiter
from gather.utils import cache
from marshmallow import Schema, fields, post_load, validate
from sqlalchemy import func
from webargs import ValidationError, fields
from webargs.flaskparser import use_kwargs

api = Blueprint("join", __name__, url_prefix=f"/join")


@cache.cached(timeout=86400, key_prefix="legacy_users_list")  # one day
def legacy_users_list():
    try:
        with open("/api/gather/legacy/users.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


class JoinRequest(Schema):
    name = fields.Str(required=True)

    @post_load
    def validate_form(self, data, **kwargs):
        name = data.get("name")

        if name not in legacy_users_list():
            raise ValidationError({"name": f"{name} is not in the invite list"})

        if User.query.filter(func.lower(User.name) == name.lower()).first():
            raise ValidationError({"name": f"{name} already exists"})

        if Applicant.query.filter(
            func.lower(Applicant.name) == name.lower()
        ).first():
            raise ValidationError({"name": f"{name} is already applying"})

        return {"name": name}


@api.route("", methods=["POST"])
@limiter.limit("20 per minute")
@use_kwargs(JoinRequest(), location="json")
def user_join(name):
    applicant = Applicant(name=name)
    applicant.invite_token = Applicant.generate_invite_token()

    db.session.add(applicant)
    db.session.commit()

    # send the verification link to them
    link = f"{URL}/join/{applicant.invite_token}"
    try:
        response = YH3().send_message(
            recipient=applicant.name,
            subject="A super secret message!",
            content=f'The secret code is <a href="{link}">{link}</a>',
        )
    except Exception as e:
        return str(e), 500

    if response.status_code != 200:
        return "Couldn't send invite link", response.status_code

    return "", 204


def validate_verify_code(code):
    if not code:
        raise ValidationError("No code provided")

    if not Applicant.query.filter(Applicant.invite_token == code).first():
        raise ValidationError("Invalid code")

    return code


def validate_verify_email(email):
    if User.query.filter(User.email == email).first():
        raise ValidationError("Invalid email.")

    return email


class VerifyRequest(Schema):
    code = fields.Str(required=True)
    email = fields.Email(required=True)

    @post_load
    def validate_form(self, data, **kwargs):
        code = data.get("code")
        email = data.get("email")

        if not code:
            raise ValidationError({"code": "No code provided"})

        if not email:
            raise ValidationError({"email": "Invalid email"})

        applicant = Applicant.query.filter(
            Applicant.invite_token == code
        ).first()

        if not applicant:
            raise ValidationError({"code": "Invalid code"})

        if User.query.filter(User.email == email).first():
            raise ValidationError({"email": "Invalid email"})

        return dict(applicant=applicant, email=email)


@api.route("verify", methods=["POST"])
@limiter.limit("30 per minute")
@use_kwargs(VerifyRequest())
def user_verify(applicant, email):
    user = User(
        name=applicant.name,
        email=email,
        slug=User.generate_slug(applicant.name),
        password_reset_token=User.generate_password_reset_token(),
        application=applicant,
    )

    applicant.invite_token = None
    applicant.user = user

    db.session.add(user)
    db.session.commit()

    send_password_reset_email(user)

    return "", 204
