import os
from datetime import datetime, timezone

import boto3
from email_validator import EmailNotValidError, validate_email
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, current_user
from gather.config import AVATARS_LOCATION, MODE
from gather.models import User, db
from gather.mail import send_email_verification_email
from gather.routes import limiter
from gather.schemas import me_schema
from gather.validators import password_complexity
from marshmallow import Schema, ValidationError, fields, post_load, validate
from webargs import ValidationError, fields, validate
from webargs.flaskparser import use_kwargs

api = Blueprint("preferences", __name__, url_prefix=f"/preferences")


allowed_mimes = {
    "image/gif": "gif",
    # "image/jpeg": "jpg",
    # "image/png": "png",
}
allowed_keys = list(allowed_mimes.keys())


class PreferencesUpdateSchema(Schema):
    email = fields.Email()
    current_password = fields.Str()
    new_password1 = fields.Str()
    new_password2 = fields.Str()
    preferred_name = fields.Str()
    location = fields.Str()
    about = fields.Str()
    flickr = fields.Str()
    facebook = fields.Str()
    instagram = fields.Str()
    random_titles = fields.Bool(load_default=False)
    hide_enemies = fields.Bool(load_default=False)
    threads_per_page = fields.Integer(validate=validate.OneOf([25, 50, 100]))
    comments_per_page = fields.Integer(validate=validate.OneOf([25, 50, 100]))

    @post_load
    def validate_passwords(self, data, **kwargs):
        current_password = data.get("current_password")
        new_password1 = data.get("new_password1")
        new_password2 = data.get("new_password2")

        del data["current_password"]
        del data["new_password1"]
        del data["new_password2"]

        if current_password or new_password1 or new_password2:
            errors = {}
            if not current_password:
                errors["current_password"] = "required for password reset"
            if not new_password1:
                errors["new_password1"] = "required for password reset"
            if not new_password2:
                errors["new_password2"] = "required for password reset"

            # if we've accumulated any errors, raise them now
            if errors:
                raise ValidationError(errors)
            else:
                if not password_complexity(new_password1):
                    raise ValidationError(
                        {"new_password1": "not complex enough"}
                    )

                if new_password1 != new_password2:
                    raise ValidationError(
                        {"new_password2": "passwords must match"}
                    )

                if not current_user.check_password(current_password):
                    raise ValidationError(
                        {"current_password": "this isn't your password"}
                    )

                data["password"] = new_password1

        return data

    @post_load
    def validate_email(self, data, **kwargs):
        email = data.get("email")

        if not email:
            return data

        del data["email"]

        # if this is the persons email
        if email == current_user.email:
            return data

        try:
            email = validate_email(email, check_deliverability=False).normalized
        except EmailNotValidError as e:
            raise ValidationError({"email": "Bad email"})

        if current_user.email_reset_token:
            raise ValidationError({"email": "Reset in progress"})

        if User.query.filter_by(email=email).first():
            raise ValidationError({"email": "Email being used"})

        # email can be safely changed to this
        data["email"] = email
        return data


class UserAvatarUpdateSchema(Schema):
    avatar = fields.Field(required=False)

    @post_load
    def validate_avatar(self, data, **kwargs):
        avatar = data.get("avatar")

        if not avatar:
            return data

        if avatar.mimetype not in allowed_keys:
            raise ValidationError({"avatar": "gif only for the moment"})

        if (file_size := avatar.seek(0, 2)):
            if file_size > 5 * 1024:
                raise ValidationError({"avatar": "file size too large"})
        else:
            raise ValidationError({"avatar": "unable to determine file size"})

        return data


@api.route("", methods=["POST"])
@limiter.limit("5 per minute")
@jwt_required()
@use_kwargs(PreferencesUpdateSchema(), location="form")
@use_kwargs(UserAvatarUpdateSchema(), location="files")
def update_preferences(**prefs):
    user = current_user

    user.preferred_name = prefs.get("preferred_name")
    user.location = prefs.get("location")
    user.about = prefs.get("about")
    user.flickr = prefs.get("flickr")
    user.facebook = prefs.get("facebook")
    user.instagram = prefs.get("instagram")
    user.random_titles = prefs["random_titles"]
    user.hide_enemies = prefs["hide_enemies"]
    user.threads_per_page = prefs["threads_per_page"]
    user.comments_per_page = prefs["comments_per_page"]

    if password := prefs.get("password"):
        user.set_password(password)

    if (avatar := request.files.get("avatar")) and (
        ext := allowed_mimes.get(avatar.mimetype)
    ):
        filename = f"{user.id}.{ext}"

        if MODE == "production":
            boto3.client("s3").upload_fileobj(
                avatar,
                "yayhooray-avatars",
                filename,
            )
        else:
            avatar.save(f"/static/avatars/{filename}")

        user.avatar = filename

    if email := prefs.get("email"):
        user.email = email
        user.email_reset_token = User.generate_email_reset_token()
        user.email_reset_sent_at = datetime.now(timezone.utc)
        send_email_verification_email(user)

    db.session.add(user)
    db.session.commit()

    return me_schema.dumps(user), 200


@api.route("html", methods=["POST"])
@jwt_required()
def toggle_html():
    user = current_user

    user.html = not user.html

    db.session.add(user)
    db.session.commit()

    return dict(html=user.html), 200


def validate_potential_buddy(name):
    if not User.query.filter_by(name=name).first():
        raise ValidationError("No such user.")

    return name
