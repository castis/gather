import flask

commands = flask.Blueprint("app", __name__)

from .mail import bp as mail_bp

# commands.register_blueprint(mirror_bp)
commands.register_blueprint(mail_bp)
