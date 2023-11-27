from flask import Blueprint
from flask_jwt_extended import jwt_required
from gather.models import Comment, RelationshipType, Thread, User, db, user_relationship
from gather.schemas import (
    comment_schema,
    comments_schema,
    thread_schema,
    threads_schema,
    title_schema,
    user_schema,
)
from gather.utils import cache, get_page
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from webargs import ValidationError, fields
from webargs.flaskparser import use_kwargs

api = Blueprint("users", __name__, url_prefix=f"/users")


@api.route("", methods=["GET"])
def user_list():
    paginator = User.query.paginate(page=get_page(), per_page=25)
    return {
        "items": [user_schema.dump(item) for item in paginator.items],
        "total": paginator.total,
        "has_prev": paginator.has_prev,
        "has_next": paginator.has_next,
        "per_page": paginator.per_page,
        "page": paginator.page,
    }, 200


@cache.cached(timeout=30)
def get_user_counts(user_id):
    comments_count = (
        db.session.query(func.count(Comment.id))
        .filter(Comment.author_id == user_id)
        .scalar()
    )

    threads_count = (
        db.session.query(func.count(Thread.id))
        .filter(Thread.author_id == user_id)
        .scalar()
    )

    return comments_count, threads_count


@api.route("/<slug>", methods=["GET"])
@jwt_required()
def user_detail(slug):
    if user := User.query.filter(User.slug == slug).first():
        comments_count, threads_count = get_user_counts(user.id)
        comments = (
            db.session.query(Comment, Thread.title, Thread.slug)
            .join(Thread, Comment.thread_id == Thread.id)
            .filter(Comment.author_id == user.id)
            .order_by(Comment.created_at.desc())
            .limit(10)
            .all()
        )

        return {
            "user": user_schema.dump(user),
            "stats": {
                "comments": comments_count,
                "threads": threads_count,
            },
            "comments": [
                {
                    **comment_schema.dump(comment),
                    "thread_title": title,
                    "thread_slug": slug,
                }
                for comment, title, slug in comments
            ],
        }, 200
    return "", 404
