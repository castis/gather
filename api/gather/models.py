import enum
import uuid
from datetime import datetime

from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from gather.utils import random_string
from slugify import slugify
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    or_,
)
from sqlalchemy.orm import aliased, backref, relationship
from werkzeug.security import check_password_hash, generate_password_hash

migrate = Migrate()
db = SQLAlchemy(session_options={"autocommit": False})
meta = MetaData()


class RelationshipType(enum.Enum):
    buddy = "1"
    enemy = "2"


user_relationship = Table(
    "user_relationships",
    db.Model.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("related_id", Integer, ForeignKey("users.id")),
    Column("type", Enum(RelationshipType)),
    Column("created_at", DateTime, default=datetime.now),
    Column("updated_at", DateTime, default=datetime.now, onupdate=datetime.now),
    UniqueConstraint("user_id", "related_id", name="unique_user_relationship"),
)


class User(db.Model):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    legacy_order = Column(Integer, unique=True)
    name = Column(String(32), unique=True, nullable=False)
    slug = Column(String(32), unique=True, nullable=False)
    avatar = Column(String(32), default=None)

    email = Column(String(255), unique=True)
    email_reset_token = Column(String(64), unique=True)
    email_reset_sent_at = Column(DateTime)

    password_hash = Column(String(255))
    password_reset_token = Column(String(64), unique=True)
    password_reset_sent_at = Column(DateTime)

    inbox = relationship(
        "DirectThread",
        backref="recipient",
        lazy="dynamic",
        foreign_keys="DirectThread.recipient_id",
    )

    outbox = relationship(
        "DirectThread",
        backref="author",
        lazy="dynamic",
        foreign_keys="DirectThread.author_id",
    )

    # able to change title, use new post notifier, etc
    privileged = Column(Boolean, default=True)

    # both are unused at the moment
    admin = Column(Boolean, default=False)
    theme = Column(String(16), default="light")

    banned = Column(Boolean, default=False)
    banned_reason = Column(String(255))

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    last_seen_at = Column(DateTime, default=datetime.now)

    # info
    preferred_name = Column(String(255))
    location = Column(String(255))
    about = Column(Text())
    flickr = Column(String(255))
    facebook = Column(String(255))
    instagram = Column(String(255))

    # settings
    random_titles = Column(Boolean, default=True)
    hide_enemies = Column(Boolean, default=True)
    threads_per_page = Column(Integer, default=50, nullable=False)
    comments_per_page = Column(Integer, default=50, nullable=False)
    html = Column(Boolean, default=True)

    # the application this user originated from
    application = relationship("Applicant", backref="user", uselist=False)

    relationships = relationship(
        "User",
        secondary=user_relationship,
        primaryjoin=id == user_relationship.c.user_id,
        secondaryjoin=id == user_relationship.c.related_id,
        back_populates="relationships",
    )

    votes = relationship("ApplicationVote", back_populates="user")
    # direct_threads = relationship("DirectThread", back_populates="author")
    # direct_comments = relationship("DirectComment", back_populates="author")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return (
            check_password_hash(self.password_hash, password)
            if self.password_hash and password
            else False
        )

    def __repr__(self):
        return f"<User {self.name}>"

    @staticmethod
    def generate_slug(name):
        slug = slugify(name)

        i = 1
        while User.query.filter_by(slug=slug).first():
            i += 1
            slug = f"{slugify(name)}-{i}"

        return slug

    @staticmethod
    def generate_password_reset_token(size=3):
        token = random_string(size)
        while User.query.filter_by(password_reset_token=token).first():
            token = random_string(size)
        return token

    @staticmethod
    def generate_email_reset_token(size=3):
        token = random_string(size)
        while User.query.filter_by(email_reset_token=token).first():
            token = random_string(size)
        return token


class Applicant(db.Model):
    __tablename__ = "applicants"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    application = Column(Text())
    denied = Column(Boolean, default=False)
    invite_token = Column(String(64), unique=True, nullable=True)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # the user this applicant became
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # people who vouched for this user
    votes = relationship("ApplicationVote", back_populates="applicant")

    def __repr__(self):
        return f"<Applicant {self.name}>"

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    @staticmethod
    def generate_invite_token(size=3):
        invite_token = random_string(size)

        while Applicant.query.filter_by(invite_token=invite_token).first():
            invite_token = random_string(size)

        return invite_token


class VoteType(enum.Enum):
    yay = "1"
    nay = "2"


class ApplicationVote(db.Model):
    __tablename__ = "application_votes"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    applicant_id = Column(
        Integer, ForeignKey("applicants.id"), primary_key=True
    )
    type = Column(Enum(VoteType))
    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="votes")
    applicant = relationship("Applicant", back_populates="votes")


class Title(db.Model):
    __tablename__ = "titles"
    id = Column(Integer, primary_key=True)
    text = Column(String(36))
    author_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", backref="titles")
    created_at = Column(DateTime, default=datetime.now)


class ThreadCategories(enum.Enum):
    discussion = "1"
    project = "2"
    advice = "3"
    meaningless = "4"


class Thread(db.Model):
    __tablename__ = "threads"
    id = Column(Integer, primary_key=True)
    mongo_id = Column(String(24), unique=True)
    title = Column(String(128))
    slug = Column(String(128), unique=True, index=True)
    legacy_slug = Column(String(128), index=True)
    category = Column(
        Enum(ThreadCategories), default=ThreadCategories.discussion
    )
    public = Column(Boolean, default=False)
    nsfw = Column(Boolean, default=False)
    enabled = Column(Boolean, default=True)
    bot = Column(Boolean, default=True)

    author_id = Column(Integer, ForeignKey("users.id"))
    author = relationship(
        "User", backref="threads", lazy="joined", foreign_keys=[author_id]
    )

    last_author_id = Column(Integer, ForeignKey("users.id"))
    last_author = relationship(
        "User", lazy="joined", foreign_keys=[last_author_id]
    )

    comments = relationship(
        "Comment",
        backref="thread",
        order_by="Comment.created_at",
    )
    comment_count = Column(Integer)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)

    def __repr__(self):
        return f"<Thread {self.title}>"

    @staticmethod
    def generate_slug(title):
        slug = slugify(title)

        i = 1  # the first duplicate should get a -2
        while Thread.query.filter_by(slug=slug).first():
            i += 1
            slug = f"{slugify(title)}-{i}"

        return slug


class Comment(db.Model):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    mongo_id = Column(String(24), unique=True)
    thread_id = Column(Integer, ForeignKey("threads.id"))
    processed = Column(Boolean, default=False)

    author_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", backref="comments")

    content = Column(Text())
    points = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        return f'<Comment "{self.content[0:10]}">'

    def serialize(self):
        return {
            "id": self.id,
            "content": self.content,
            "points": self.points,
        }


# newer_comments = aliased(Comment)

# # based on https://stackoverflow.com/questions/57334377/how-to-construct-a-sqlalchemy-relationship-that-takes-the-record-most-recently-i
# # assign thread.last_comment to be the last actual comment
# latest_comments_query = (
#     select([Comment])
#     .select_from(
#         outerjoin(
#             Comment,
#             newer_comments,
#             and_(
#                 newer_comments.thread_id == Comment.thread_id,
#                 newer_comments.created_at > Comment.created_at,
#             ),
#         )
#     )
#     .where(newer_comments.id == None)
#     .alias()
# )

# latest_comments = aliased(Comment, latest_comments_query)
# Thread.last_comment = relationship(
#     latest_comments,
#     uselist=False,
#     viewonly=True,
# )


class DirectThread(db.Model):
    __tablename__ = "direct_threads"
    id = Column(Integer, primary_key=True)
    title = Column(String(128))
    slug = Column(String(128), unique=True, index=True)

    author_id = Column(Integer, ForeignKey("users.id"))
    # author = relationship("User", backref="outbox")

    recipient_id = Column(Integer, ForeignKey("users.id"))
    # recipient = relationship("User", backref="inbox")

    comments = relationship("DirectComment", backref="thread")

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        return f"<DirectThread {self.title}>"

    @staticmethod
    def generate_slug():
        slug = str(uuid.uuid4())
        while DirectThread.query.filter_by(slug=slug).first():
            slug = str(uuid.uuid4())
        return slug


class DirectComment(db.Model):
    __tablename__ = "direct_comments"
    id = Column(Integer, primary_key=True)

    author_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", backref="direct_comments")

    thread_id = Column(Integer, ForeignKey("direct_threads.id"))

    content = Column(Text())
    read = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        return f"<DirectComment {self.id}>"
