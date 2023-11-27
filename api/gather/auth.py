import re
from datetime import datetime, timedelta, timezone
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    set_access_cookies,
)
from gather.models import User, db

jwt = JWTManager()
cors = CORS(
    resources={
        r"/*": {
            "origins": "*",
            "supports_credentials": True,
        }
    }
)


@jwt.user_identity_loader
def user_identity_lookup(user) -> str:
    return user.slug


@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data) -> User:
    user = User.query.filter_by(
        slug=jwt_data["sub"],
        banned=False,
    ).one_or_none()

    if user:
        user.last_seen_at = datetime.now(timezone.utc)
        db.session.add(user)
        db.session.commit()

    return user


def token_near_expiration(jwt: dict) -> bool:
    if expiration := jwt.get("exp"):
        current_time = datetime.now(timezone.utc)
        return (
            datetime.timestamp(current_time + timedelta(minutes=30))
            > expiration
        )
    return False


def register_after_request_handler(app):
    @app.after_request
    def refresh_expiring_jwts(response):
        try:
            token = get_jwt()
            if token_near_expiration(token):
                access_token = create_access_token(identity=get_jwt_identity())
                set_access_cookies(response, access_token)
            return response
        except (RuntimeError, KeyError):
            pass

        return response
