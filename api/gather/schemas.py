from flask_marshmallow import Marshmallow
from gather.models import (
    Applicant,
    Comment,
    DirectComment,
    DirectThread,
    RelationshipType,
    Thread,
    Title,
    User,
)
from marshmallow import EXCLUDE, Schema, fields


def decode_emojis(text):
    return text.replace("[&gt;|]", "[>|]").replace("[&gt;&lt;]", "[><]")


ma = Marshmallow()


class UserSchema(ma.Schema):
    class Meta:
        model = User
        fields = (
            "id",
            "legacy_order",
            "name",
            "privileged",
            "banned",
            "slug",
            "icon",
            "avatar",
            "created_at",
        )


user_schema = UserSchema()


class TitleSchema(ma.Schema):
    class Meta:
        model = Title
        fields = ("text", "author", "created_at")

    author = ma.Nested(user_schema)


title_schema = TitleSchema()


class ApplicantSchema(ma.Schema):
    class Meta:
        model = Applicant
        fields = ("name", "application", "created_at")


applicant_schema = ApplicantSchema()


class MeSchema(ma.Schema):
    class Meta:
        model = User
        fields = (
            "id",
            "name",
            "slug",
            "email",
            "icon",
            "date_created",
            "threads_per_page",
            "comments_per_page",
            "privileged",
            "html",
            "theme",
            "avatar",
            "random_titles",
            "hide_enemies",
            "instagram",
            "facebook",
            "flickr",
            "about",
            "location",
            "preferred_name",
            "password_reset_sent_at",
            "email_reset_sent_at",
        )


me_schema = MeSchema()


class ThreadSchema(ma.Schema):
    class Meta:
        model = Thread
        fields = (
            "id",
            "title",
            "slug",
            "nsfw",
            "enabled",
            "author",
            "last_author",
            "created_at",
            "updated_at",
            "category",
            "comment_count",
            # "last_comment",
        )

    category = ma.Function(lambda thread: thread.category.name)
    # last_comment = ma.Function(lambda thread: comments_schema.dump(thread.last_comment))
    author = ma.Nested(user_schema)
    last_author = ma.Nested(user_schema)


thread_schema = ThreadSchema()
threads_schema = ThreadSchema(many=True)


class CommentSchema(ma.Schema):
    class Meta:
        model = Comment
        fields = (
            "id",
            "icon",
            "points",
            "content",
            "author",
            "created_at",
        )

    author = ma.Nested(user_schema)
    content = ma.Function(lambda obj: decode_emojis(obj.content))


comment_schema = CommentSchema()
comments_schema = CommentSchema(many=True)


class UserField(fields.Field):
    def _deserialize(self, value, attr, data, **kwargs):
        user = User.query.filter_by(name=value).first()
        if not user:
            raise ValidationError("User not found")
        return UserSchema().dump(user)


class RelationshipSchema(Schema):
    related = UserField(attribute="related_id")
    type = fields.Method(
        "get_relationship_type",
        deserialize="load_relationship_type",
    )
    created_at = fields.DateTime()

    class Meta:
        unknown = EXCLUDE

    def get_relationship_type(self, obj):
        # Method to serialize the Enum field
        return obj.type.name if obj.type else None

    def load_relationship_type(self, value):
        # Method to deserialize the Enum field
        try:
            return RelationshipType[value]
        except KeyError:
            raise ValueError(f"Invalid relationship type: {value}")


relationship_schema = RelationshipSchema()


class DirectCommentSchema(Schema):
    class Meta:
        model = DirectComment
        fields = (
            "author",
            "content",
            "read",
            "created_at",
        )

    author = ma.Nested(user_schema)
    content = ma.Function(lambda obj: decode_emojis(obj.content))


direct_comment_schema = DirectCommentSchema()
direct_comments_schema = DirectCommentSchema(many=True)


class DirectThreadSchema(Schema):
    class Meta:
        model = DirectThread
        fields = (
            "slug",
            "title",
            "author",
            "recipient",
            "comments",
            "created_at",
            "updated_at",
        )

    author = ma.Nested(user_schema)
    recipient = ma.Nested(user_schema)
    comments = ma.Nested("DirectCommentSchema", many=True)


direct_thread_schema = DirectThreadSchema()
direct_threads_schema = DirectThreadSchema(many=True)
