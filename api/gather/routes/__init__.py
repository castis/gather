import os
from datetime import datetime

from flask import Blueprint
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from gather.models import Thread, db
from gather.utils import cache, logger
from sqlalchemy import text

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.environ.get("REDIS_URI"),
    strategy="fixed-window",
    default_limits=[
        "3000 per day",
        "300 per hour",  # Helps prevent long-term abuse
        "50 per minute",  # Reasonable for active participation
        "10 per second",  # Prevents rapid-fire requests
    ],
)


api = Blueprint("api", __name__, url_prefix="")

# from .applications import api as applications_api
from .auth import api as auth_api
from .join import api as join_api
from .messages import api as messages_api
from .preferences import api as pref_api
from .relationships import api as relationships_api
from .threads import api as threads_api
from .users import api as users_api

api = Blueprint("api", __name__, url_prefix="")

# api.register_blueprint(applications_api)
api.register_blueprint(auth_api)
api.register_blueprint(messages_api)
api.register_blueprint(threads_api)
api.register_blueprint(users_api)
api.register_blueprint(relationships_api)
api.register_blueprint(join_api)
api.register_blueprint(pref_api)


@api.route("health", methods=["GET"])
def health():
    return "", 200


def get_redis_status() -> bool:
    try:
        cache.set("health", "ok")
        return cache.get("health") == "ok"
    except Exception as e:
        logger.error(e)
    return False


def get_db_status() -> bool:
    try:
        Thread.query.first()
        return True
    except Exception as e:
        logger.error(e)
    return False


@api.route("status", methods=["GET"])
def status():
    return {
        "db": get_db_status(),
        "cache": get_redis_status(),
        "current_time": datetime.now().strftime("%A, %B %-d, %-I:%M:%S%p"),
    }, 200


# @api.route("statistics", methods=["GET"])
# @cache.cached(timeout=86400)  # one day
# def overall_statistics():
#     response = db.session.execute(
#         text(
#             """SELECT
#             time_bucket('1 month', comments.created_at) AS time,
#             count(comments.id) AS c
#         FROM comments
#         GROUP BY time
#         ORDER BY time"""
#         )
#     )

#     return {
#         "current_time": datetime.now().strftime("%A, %B %-d, %-I:%M:%S%p"),
#         "comments": [
#             {"date": dt.strftime("%Y-%m-%dT%H:%M:%S"), "value": c}
#             for (dt, c) in response.fetchall()
#         ],
#     }, 200
