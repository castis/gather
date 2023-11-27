import os
import sys
import tempfile

import pytest
from flask_jwt_extended import create_access_token

# make app importable
sys.path.insert(1, os.path.join(sys.path[0], ".."))

from gather.app import create_app
from gather.models import Applicant, Comment, Thread, ThreadCategories, User, db
from gather.utils import random_string


def client_with_jwt(client, user):
    access_token = create_access_token(identity=user)
    client.set_cookie("party_invite", access_token)
    return client


@pytest.fixture
def client():
    app = create_app(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:////tmp/test.db",
        RATELIMIT_ENABLED=False,
        JWT_COOKIE_CSRF_PROTECT=False,
    )

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()


@pytest.fixture
def enabled_user():
    name = random_string(numwords=1)
    user = User(
        name=name,
        email=f"{name}@example.com",
        slug=User.generate_slug(name),
    )
    user.set_password("party!")

    db.session.add(user)
    db.session.commit()

    return user


@pytest.fixture
def thread(user):
    title = random_string(numwords=3, delimiter=" ")
    thread = Thread(
        user_id=user.id,
        title=title,
        slug=Thread.generate_slug(title),
        category=ThreadCategories.advice,
        nsfw=False,
    )
    for c in range(3):
        comment(user, thread)
    return thread


def comment(user, thread):
    return Comment(
        user=user,
        thread=thread,
        content=random_string(numwords=10, delimiter=" "),
    )


@pytest.fixture
def applicant():
    name = random_string(numwords=1)
    applicant = Applicant(
        name=name,
        email=f"{name}@example.com",
        application=random_string(numwords=10, delimiter=" "),
    )

    db.session.add(applicant)
    db.session.commit()

    return applicant
