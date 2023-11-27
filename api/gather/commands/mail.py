from flask import Blueprint
from gather.models import User

bp = Blueprint("mail", __name__, cli_group="mail")
bp.cli.short_help = "Various mail operations."


@bp.cli.command("test")
def test_email():
    from gather.mail import send

    send(User.query.first(), "test subject", "test content goes here")
