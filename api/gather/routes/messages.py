from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required
from gather.models import Applicant, DirectComment, DirectThread, User, db
from gather.schemas import (
    direct_comment_schema,
    direct_comments_schema,
    direct_thread_schema,
    direct_threads_schema,
)
from marshmallow import Schema, fields, post_load
from sqlalchemy import or_
from webargs import ValidationError, fields
from webargs.flaskparser import use_kwargs

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
@use_kwargs({"page": fields.Int(load_default=1)})
def message_inbox(page):
    paginator = DirectThread.query.filter_by(
        recipient_id=current_user.id
    ).paginate(page=page, per_page=25)

    return {
        "items": direct_threads_schema.dump(paginator.items),
        "total": paginator.total,
        "has_prev": paginator.has_prev,
        "has_next": paginator.has_next,
        "per_page": paginator.per_page,
        "page": paginator.page,
    }


@api.route("sent", methods=["GET"])
@jwt_required()
@use_kwargs({"page": fields.Int(load_default=1)})
def message_sent(page):
    paginator = DirectThread.query.filter_by(
        author_id=current_user.id
    ).paginate(page=page, per_page=25)

    return {
        "items": direct_threads_schema.dump(paginator.items),
        "total": paginator.total,
        "has_prev": paginator.has_prev,
        "has_next": paginator.has_next,
        "per_page": paginator.per_page,
        "page": paginator.page,
    }


class MessageSendRequest(Schema):
    user = fields.String(required=True)
    title = fields.String(required=True)
    content = fields.String(required=True)

    @post_load
    def validate_form(self, data, **kwargs):
        user = User.query.filter_by(name=data["user"]).first()
        if not user:
            raise ValidationError({"user": "Invalid user"})
        data["user"] = user
        return data


@api.route("send", methods=["POST"])
@jwt_required()
@use_kwargs(MessageSendRequest())
def message_send(
    user,
    title,
    content,
):
    thread = DirectThread(
        slug=DirectThread.generate_slug(),
        author=current_user,
        recipient=user,
        title=title,
    )

    comment = DirectComment(
        content=content,
        author=current_user,
        thread=thread,
    )

    db.session.add(thread)
    db.session.add(comment)
    db.session.commit()

    return direct_thread_schema.dump(thread), 200


class ReadMessageRequest(Schema):
    slug = fields.String(required=True)
    page = fields.Int(load_default=1)

    @post_load
    def validate_form(self, data, **kwargs):
        thread = DirectThread.query.filter(
            DirectThread.slug == data["slug"],
            or_(
                DirectThread.recipient_id == current_user.id,
                DirectThread.author_id == current_user.id
            )
        ).first()

        if not thread:
            raise ValidationError({"slug": "Invalid slug"})

        return dict(
            thread=thread,
            page=data["page"],
        )

@api.route("message", methods=["POST"])
@jwt_required()
@use_kwargs(ReadMessageRequest())
def message_detail(thread, page):
    return direct_thread_schema.dump(thread), 200
