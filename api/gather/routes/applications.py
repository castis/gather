from flask import Blueprint
from flask_jwt_extended import jwt_required, current_user
from gather.models import Applicant, ApplicationVote, VoteType, db
from gather.schemas import applicant_schema
from gather.validators import validate_email, validate_name
from webargs import ValidationError, fields
from webargs.flaskparser import use_kwargs

api = Blueprint("applications", __name__, url_prefix=f"/applications")


@api.route("", methods=["GET"])
@jwt_required()
@use_kwargs(
    {
        "page": fields.Int(load_default=1),
    }
)
def applicant_list(page):
    applicants = Applicant.query.distinct()

    paginator = applicants.paginate(
        page=page,
        per_page=current_user.threads_per_page,
    )

    return {
        "items": [applicant_schema.dump(item) for item in paginator.items],
        "total": paginator.total,
        "has_prev": paginator.has_prev,
        "has_next": paginator.has_next,
        "per_page": paginator.per_page,
        "page": paginator.page,
    }, 200


def validate_applicant_name(name):
    if Applicant.query.filter_by(name=name).first():
        raise ValidationError("Taken.")
    validate_name(name)


def validate_applicant_email(email):
    if Applicant.query.filter_by(email=email).first():
        raise ValidationError("Taken.")
    return validate_email(email)


def validate_application(text):
    if len(text) < 10:
        raise ValidationError("Too short.")


@api.route("", methods=["POST"])
@use_kwargs(
    {
        "name": fields.Str(required=True, validate=validate_applicant_name),
        "email": fields.Str(required=True, validate=validate_applicant_email),
        "application": fields.Str(required=True, validate=validate_application),
    },
)
def applicant_create(name, email, application):
    # TODO: memoize this?
    email = validate_email(
        email,
        check_deliverability=False,
    ).email

    db.session.add(Applicant(
        name=name,
        email=email,
        application=application,
    ))

    db.session.commit()
    return {"msg": "ok"}, 200


def validate_vote_type(type):
    if type and type not in VoteType.__members__:
        acceptable = ", ".join(VoteType.__members__)
        raise ValidationError(f"use one of: {acceptable}")


@api.route("vote", methods=["PUT"])
@jwt_required()
@use_kwargs(
    {
        "name": fields.Str(required=True),
        "type": fields.Str(required=True, validate=validate_vote_type),
    },
)
def applicant_vote(name, type):
    user = current_user
    applicant = Applicant.query.filter_by(name=name).first()
    if not applicant:
        return {
            "msg": "Applicant not found.",
        }, 422

    vote = ApplicationVote.query.filter_by(
        user_id=user.id,
        applicant_id=applicant.id,
    ).first()

    if vote:
        vote.type = type
    else:
        vote = ApplicationVote(
            user_id=user.id, applicant_id=applicant.id, type=type
        )

    db.session.add(vote)
    db.session.commit()

    return {"msg": "ok"}, 200
