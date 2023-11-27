from flask import Blueprint

from flask_jwt_extended import jwt_required, current_user
from gather.models import DirectComment, Applicant

api = Blueprint("messages", __name__, url_prefix=f"/messages")


@api.route("", methods=["GET"])
@jwt_required()
def message_info():
    user = current_user

    inbox = DirectComment.query.filter_by(
        author_id=user.id,
        read=False,
    ).count()

    applicants = Applicant.query.filter_by(
        user_id=None,
        denied=None,
    ).count()

    return {
        "inbox": inbox,
        "applicants": applicants,
    }, 200


@api.route("inbox", methods=["GET"])
@jwt_required()
def message_inbox():
    return {
        "items": [],
        "total": 0,
        "has_prev": None,
        "prev_num": None,
        "has_next": None,
        "next_num": None,
        "per_page": 10,
        "page": 1,
    }, 200


@api.route("sent", methods=["GET"])
@jwt_required()
def message_sent():
    return {
        "items": [],
        "total": 0,
        "has_prev": None,
        "prev_num": None,
        "has_next": None,
        "next_num": None,
        "per_page": 10,
        "page": 1,
    }, 200


@api.route("send", methods=["POST"])
@jwt_required()
def message_send():
    return {"status": "ok"}, 200


@api.route("<id>")
@jwt_required()
def message_detail():
    return {
        "items": [],
        "total": 0,
        "has_prev": None,
        "prev_num": None,
        "has_next": None,
        "next_num": None,
        "per_page": 10,
        "page": 1,
    }, 200
