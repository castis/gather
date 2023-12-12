import flask

commands = flask.Blueprint("app", __name__)

from gather.commands.test import bp as test_bp
from gather.commands.user import bp as user_bp
from gather.commands.auth import bp as auth_bp
from gather.commands.message import bp as message_bp

commands.register_blueprint(test_bp)
commands.register_blueprint(user_bp)
commands.register_blueprint(auth_bp)
commands.register_blueprint(message_bp)
