from flask import Blueprint
from flask_jwt_extended import jwt_required, current_user
from gather.models import RelationshipType, User, db, user_relationship
from gather.schemas import user_schema
from gather.utils import cache, get_page
from webargs import ValidationError, fields
from webargs.flaskparser import use_kwargs

api = Blueprint("relationships", __name__, url_prefix=f"/relationships")



def clear_buddies_caches(user):
    cache.delete(f"get_buddies:{user.id}")
    cache.delete(f"buddies_count:{user.id}")



def get_relationships(user, relationship_type) -> dict[str, any]:
    paginator = (
        db.session.query(User)
        .join(
            user_relationship,
            user_relationship.c.related_id == User.id,
        )
        .filter(
            user_relationship.c.user_id == user.id,
            user_relationship.c.type == relationship_type,
        )
        .paginate(page=get_page(), per_page=25)
    )

    return {
        "items": [user_schema.dump(item) for item in paginator.items],
        "total": paginator.total,
        "has_prev": paginator.has_prev,
        "has_next": paginator.has_next,
        "per_page": paginator.per_page,
        "page": paginator.page,
    }


@api.route("", methods=["GET"])
@jwt_required()
def relationship_list():
    return {
        "buddies": get_relationships(current_user, RelationshipType.buddy),
        "enemies": get_relationships(current_user, RelationshipType.enemy),
    }, 200


def validate_target_type(type):
    if type and type not in RelationshipType.__members__:
        acceptable = ", ".join(RelationshipType.__members__)
        raise ValidationError(f"Invalid, ({acceptable}).")


def validate_target_user(name):
    if not fetch_target_user(name):
        raise ValidationError("User not found.")


@cache.cached(timeout=5)
def fetch_target_user(name):
    return User.query.filter_by(name=name).first()


@api.route("", methods=["PUT"])
@jwt_required()
@use_kwargs(
    {
        "name": fields.Str(required=True, validate=validate_target_user),
        "type": fields.Str(required=True, validate=validate_target_type),
    },
)
def add_relationship(name, type):
    user = current_user
    target = fetch_target_user(name)

    if (
        db.session.query(user_relationship)
        .filter(
            user_relationship.c.user_id == user.id,
            user_relationship.c.related_id == target.id,
        )
        .first()
    ):
        db.session.query(user_relationship).filter(
            user_relationship.c.user_id == user.id,
            user_relationship.c.related_id == target.id,
        ).update({"type": RelationshipType[type]})
        db.session.commit()
    else:
        new_relationship = user_relationship.insert().values(
            user_id=user.id,
            related_id=target.id,
            type=RelationshipType[type],
        )
        db.session.execute(new_relationship)
        db.session.commit()

    clear_buddies_caches(user)

    return user_schema.dump(target), 200


@api.route("", methods=["DELETE"])
@jwt_required()
@use_kwargs(
    {
        "name": fields.Str(required=True, validate=validate_target_user),
    },
)
def delete_relationship(name):
    user = current_user
    target = fetch_target_user(name)

    db.session.execute(
        user_relationship.delete().where(
            user_relationship.c.user_id == user.id,
            user_relationship.c.related_id == target.id,
        )
    )
    db.session.commit()

    clear_buddies_caches(user)

    return "", 204
