import pathlib

import flask
from gather.auth import cors, jwt, register_after_request_handler
from gather.commands import commands
from gather.models import db, migrate
from gather.routes import api, limiter
from gather.schemas import ma
from gather.utils import cache, logger
from whitenoise import WhiteNoise


def mount_static_dir(app, location, path):
    if pathlib.Path(path).exists():
        app.wsgi_app.add_files(path)
    else:
        logger.error(f"could not create {path}")


def create_app(**kwargs):
    app = flask.Flask(__name__)

    app.config.from_pyfile("./config.py")
    app.config.update(kwargs)

    db.init_app(app)
    ma.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    register_after_request_handler(app)
    cors.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)

    app.register_blueprint(api)
    app.register_blueprint(commands)

    if app.config["MODE"] == "development":
        app.wsgi_app = WhiteNoise(
            app.wsgi_app,
            root="/static/avatars",
            prefix="/static/avatars",
        )

    @app.errorhandler(404)
    def not_found(error):
        return "Not found", error.code

    @app.errorhandler(405)
    def method_not_allowed(error):
        return error.description, error.code

    @app.errorhandler(422)
    def unprocessable_entity(error):
        return error.data["messages"], 422

    @app.errorhandler(429)
    def rate_limited(error):
        return "You're doing that too much", error.code

    return app


app = create_app()
