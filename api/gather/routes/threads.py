from math import ceil

import html5lib
from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required
from datetime import datetime, timedelta, timezone
from gather.bot import post_comment_hook
from gather.models import Comment, Thread, ThreadCategories, Title, User, db
from gather.routes import limiter
from gather.schemas import (
    comments_schema,
    thread_schema,
    threads_schema,
    title_schema,
)
from gather.utils import encode_emojis, cache
from marshmallow import Schema, fields, post_load, validate
from webargs import ValidationError, fields
from webargs.flaskparser import use_kwargs

api = Blueprint("threads", __name__, url_prefix=f"/threads")


def validate_fragment(text):
    try:
        document = parser.parseFragment(encode_emojis(text))
    except html5lib.html5parser.ParseError:
        raise ValidationError("Invalid HTML fragment")

    for element in document.findall(".//"):
        if element.tag not in allowed_tags:
            raise ValidationError("Bad HTML fragment")


def validate_category(category):
    if category and category not in ThreadCategories.__members__:
        acceptable = ", ".join(ThreadCategories.__members__)
        raise ValidationError(f"Invalid, ({acceptable}).")


def validate_query(query):
    pass


sorts = {
    "latest": Thread.updated_at,
    "started": Thread.created_at,
    "posts": Thread.comment_count,
}
usable_sorts = list(sorts.keys())
viable_categories = list(ThreadCategories.__members__) + ["meaningful"]
viable_filters = [
    "participated",
    "favorite",
    "hidden",
    "started",
]


@api.route("", methods=["GET"])
@jwt_required(optional=True)
@use_kwargs(
    {
        "category": fields.Str(
            load_default=None, validate=validate.OneOf(viable_categories)
        ),
        "query": fields.Str(load_default=None, validate=validate_query),
        "filter": fields.Str(
            load_default=None, validate=validate.OneOf(viable_filters)
        ),
        "startedby": fields.Str(load_default=None),
        "page": fields.Int(load_default=1),
        "sort": fields.Str(load_default=usable_sorts[0]),
        "dir": fields.Str(load_default="desc"),
    },
    location="query",
)
# @cache.cached(timeout=10)
def threads_list(
    startedby,
    category,
    query,
    filter,
    page,
    sort,
    dir,
):
    threads = Thread.query.filter(Thread.comment_count > 0)

    if startedby:
        if startedby := User.query.filter_by(slug=startedby).first():
            threads = threads.filter(Thread.author == startedby)

    if category in viable_categories:
        if category := ThreadCategories.__members__.get(category):
            category_filter = Thread.category == category
        else:  # meaningful
            category_filter = Thread.category.in_(
                [
                    ThreadCategories.discussion,
                    ThreadCategories.project,
                    ThreadCategories.advice,
                ]
            )

        threads = threads.filter(category_filter)
    elif current_user:
        if filter:
            if filter == "participated":
                pass
            elif filter == "favorite":
                pass
            elif filter == "hidden":
                pass
            elif filter == "started":
                threads = threads.filter(Thread.author == current_user)
        elif query:
            threads = threads.filter(Thread.title.ilike(f"%{query}%"))

    if sort := sorts.get(sort):
        threads = threads.order_by(sort if dir == "asc" else sort.desc())

    paginator_kwargs = dict(
        page=page,
        max_per_page=100,
        per_page=25,
    )
    if current_user:
        paginator_kwargs.update(per_page=current_user.threads_per_page)

    paginator = threads.paginate(**paginator_kwargs)

    title = Title.query.order_by(Title.created_at.desc()).first()

    response = {
        "threads": {
            "items": threads_schema.dump(paginator.items),
            "total": paginator.total,
            "per_page": paginator.per_page,
            "page": paginator.page,
        },
    }

    if current_user:
        response["title"] = title_schema.dump(title)

    return response, 200


class TitleChangeRequest(Schema):
    text = fields.Str(required=True)

    @post_load
    def validate_title(self, data, **kwargs):
        if not current_user.privileged:
            raise ValidationError({"title": "No"})
        return data


@api.route("title", methods=["POST"])
@limiter.limit("2 per minute")
@jwt_required()
@use_kwargs(TitleChangeRequest())
def set_title(text):
    title = Title(
        text=text,
        author=current_user,
    )

    db.session.add(title)
    db.session.commit()

    return title_schema.dump(title), 200


class ThreadCreationRequest(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=128))
    category = fields.Str(required=True, validate=validate_category)
    content = fields.Str(required=True, validate=validate_fragment)

    @post_load
    def validate_form(self, data, **kwargs):
        if not current_user.privileged:
            raise ValidationError({"title": "No"})

        return data


@api.route("", methods=["POST"])
@limiter.limit("2 per minute")
@jwt_required()
@use_kwargs(ThreadCreationRequest())
def thread_create(title, content, category):
    user = current_user
    thread = Thread(
        title=title,
        slug=Thread.generate_slug(title),
        category=category,
        nsfw=False,
        author=user,
        last_author=user,
        comment_count=1,
    )

    comment = Comment(
        author=user,
        thread=thread,
        content=encode_emojis(content),
    )

    thread.comment_count = 1
    thread.updated_at = comment.created_at

    db.session.add(thread)
    db.session.add(comment)
    db.session.commit()

    return {"thread": thread_schema.dump(thread)}, 200


class ThreadDetailRequest(Schema):
    slug = fields.Str(required=True)
    page = fields.Int(load_default=1)

    @post_load
    def validate_form(self, data, **kwargs):
        thread = Thread.query.filter_by(slug=data["slug"]).first()
        if not thread:
            raise ValidationError({"slug": "Invalid thread"})

        return dict(
            thread=thread,
            page=data["page"],
        )


@api.route("detail", methods=["GET"])
@jwt_required()
@use_kwargs(ThreadDetailRequest(), location="query")
def thread_detail(thread, page):
    paginator = (
        Comment.query.filter(Comment.thread == thread)
        .order_by(Comment.created_at)
        .paginate(
            page=page,
            max_per_page=100,
            per_page=current_user.comments_per_page,
        )
    )

    return {
        "thread": thread_schema.dump(thread),
        "comments": {
            "total": paginator.total,
            "per_page": paginator.per_page,
            "page": paginator.page,
            "items": comments_schema.dump(paginator.items),
        },
    }, 200


@api.route("ping", methods=["POST"])
@jwt_required()
@limiter.limit("5 per minute")
@cache.cached(timeout=25)
@use_kwargs({"slug": fields.Str(required=True)})
def thread_ping(slug):
    thread = Thread.query.filter_by(slug=slug).first()

    if not thread:
        return "Thread not found", 404

    count = Comment.query.filter(Comment.thread == thread).count()

    return {
        "thread": thread_schema.dump(thread),
        "comments": {
            "total": count,
        },
    }, 200


# @api.route("stats", methods=["GET"])
# @jwt_required()
# @use_kwargs(
#     {"slug": fields.Str(required=True)},
#     location="query",
# )
# def thread_statistics(slug, **kwargs):
#     thread = Thread.query.filter_by(slug=slug).first()

#     if not thread:
#         return "Thread not found", 404

#     response = db.session.execute(
#         text(
#             f"""SELECT
#                 time_bucket('1 month', comments.created_at) as time,
#                 count(comments.id) as c
#             FROM comments
#             WHERE comments.thread_id = {thread.id}
#             GROUP BY time
#             ORDER BY time"""
#         )
#     )

#     return {
#         "thread": thread_schema.dump(thread),
#         "total_comments": len(thread.comments),
#         "comments": [
#             {"date": dt.strftime("%Y-%m-%dT%H:%M:%S"), "value": c}
#             for (dt, c) in response.fetchall()
#         ],
#     }, 200


allowed_tags = [
    "a",
    "blockquote",
    "code",
    "img",
    "p",
    "snigger",
    "spoiler",
]

parser = html5lib.HTMLParser(
    namespaceHTMLElements=False,
    strict=True,
)


@api.route("detail", methods=["POST"])
@jwt_required()
@use_kwargs(
    {
        "slug": fields.Str(required=True),
        "content": fields.Str(required=True, validate=validate_fragment),
    },
)
def thread_update(slug, content):
    user = current_user
    thread = Thread.query.filter_by(slug=slug).first()

    if not thread:
        return "Thread not found", 404

    comment = Comment(
        author=user,
        thread_id=thread.id,
        content=encode_emojis(content),
    )
    db.session.add(comment)

    thread.last_author = user
    thread.comment_count = len(thread.comments)
    thread.updated_at = comment.created_at

    db.session.add(thread)

    db.session.commit()

    paginator = (
        Comment.query.filter(Comment.thread == thread)
        .order_by(Comment.created_at)
        .paginate(
            page=ceil(thread.comment_count / user.comments_per_page),
            max_per_page=50,
            per_page=user.comments_per_page,
        )
    )

    post_comment_hook(thread, comment)

    return {
        "thread": thread_schema.dump(thread),
        "comments": {
            "total": paginator.total,
            "per_page": paginator.per_page,
            "page": paginator.page,
            "items": comments_schema.dump(paginator.items),
        },
    }, 200


@api.route("/settings", methods=["POST"])
@jwt_required()
@use_kwargs(
    {
        "slug": fields.Str(required=True),
        "title": fields.Str(),
        "nsfw": fields.Bool(),
        "enabled": fields.Bool(),
    },
)
def thread_settings(slug, title=None, nsfw=None, enabled=None):
    thread = Thread.query.filter(
        Thread.slug == slug,
        Thread.author == current_user,
    ).first()

    if not thread:
        return "", 401

    if title is not None and thread.created_at > datetime.now(
        timezone.utc
    ) - timedelta(minutes=15):
        thread.title = title
    if nsfw is not None:
        thread.nsfw = nsfw
    if enabled is not None:
        thread.enabled = enabled

    db.session.add(thread)
    db.session.commit()

    return {"thread": thread_schema.dump(thread)}, 200
