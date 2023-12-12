from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required
from gather.models import Applicant, DirectMessage, User, db, sqids
from gather.schemas import (
    direct_message_schema,
    direct_messages_schema,
)
from marshmallow import Schema, fields, post_load
from sqlalchemy import or_, update, func
from webargs import ValidationError, fields, validate
from webargs.flaskparser import use_kwargs

api = Blueprint("messages", __name__, url_prefix=f"/messages")


@api.route("", methods=["GET"])
@jwt_required()
def message_info():
    inbox = DirectMessage.query.filter_by(
        recipient_id=current_user.id,
        read_at=None,
        recipient_deleted_at=None,
    ).count()

    # applicants = Applicant.query.filter_by(
    #     user_id=None,
    #     denied=None,
    # ).count()

    return {
        "inbox": inbox,
        # "applicants": applicants,
    }, 200


def get_messages(filters, page):
    return (
        DirectMessage.query.filter_by(**filters)
        .order_by(DirectMessage.created_at.desc())
        .paginate(page=page, per_page=25)
    )


@api.route("inbox", methods=["GET"])
@jwt_required()
@use_kwargs({"page": fields.Int(load_default=1)})
def message_inbox(page):
    paginator = get_messages(
        filters=dict(recipient=current_user),
        page=page,
    )

    return {
        "items": direct_messages_schema.dump(paginator.items),
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
    paginator = get_messages(
        filters=dict(author=current_user),
        page=page,
    )

    return {
        "items": direct_messages_schema.dump(paginator.items),
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
    encrypted = fields.Bool(load_default=False)

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
    user: User,
    title: str,
    content: str,
    encrypted: bool,
):
    message = DirectMessage(
        author=current_user,
        recipient=user,
        encrypted=encrypted,
        title=title,
        content=content,
    )

    db.session.add(message)
    db.session.commit()

    return direct_message_schema.dump(message), 200


class MessageDetailRequest(Schema):
    slug = fields.String(required=True)

    @post_load
    def validate_form(self, data, **kwargs):
        try:
            (id,) = sqids.decode(data["slug"])
        except Exception:
            raise ValidationError({"slug": "Invalid slug"})

        message = DirectMessage.query.filter(
            DirectMessage.id == id,
            or_(
                DirectMessage.recipient == current_user,
                DirectMessage.author == current_user,
            ),
        ).one_or_none()

        if not message:
            raise ValidationError({"slug": "Invalid slug"})

        return dict(message=message)


@api.route("message", methods=["POST"])
@jwt_required()
@use_kwargs(MessageDetailRequest())
def message_detail(message):
    if not message.read_at and message.recipient_id == current_user.id:
        message.read_at = db.func.now()
        db.session.add(message)
        db.session.commit()
    return direct_message_schema.dump(message), 200


class UpdateMessagesRequest(Schema):
    slugs = fields.List(
        fields.String(),
        required=True,
        validate=validate.Length(min=1, max=10),
    )

    @post_load
    def validate_form(self, data, **kwargs):
        try:
            return dict(
                ids=[sqids.decode(slug)[0] for slug in data["slugs"]],
            )
        except Exception:
            raise ValidationError({"slugs": "Invalid slugs"})


@api.route("mark_read", methods=["POST"])
@jwt_required()
@use_kwargs(UpdateMessagesRequest())
def messages_mark_read(ids):
    db.session.execute(
        update(DirectMessage)
        .where(
            DirectMessage.id.in_(ids),
            DirectMessage.recipient == current_user,
        )
        .values(read_at=func.now())
    )
    db.session.commit()

    return "", 204


@api.route("mark_deleted", methods=["POST"])
@jwt_required()
@use_kwargs(UpdateMessagesRequest())
def messages_mark_deleted(ids):
    for message in DirectMessage.query.filter(
        DirectMessage.id.in_(ids),
        or_(
            DirectMessage.recipient == current_user,
            DirectMessage.author == current_user,
        ),
    ).all():
        field_to_update = (
            "author_deleted_at"
            if message.author_id == current_user.id
            else "recipient_deleted_at"
        )
        setattr(message, field_to_update, func.now())

    db.session.commit()

    return "", 204
