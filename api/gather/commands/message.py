from datetime import datetime

import click
from flask import Blueprint
from gather.mail import send_password_reset_email
from gather.models import User, db, DirectMessage

bp = Blueprint("message", __name__, cli_group="message")
bp.cli.short_help = "Messaging options"


# flask message send
@bp.cli.command("send")
def user_resend_password_reset():
    message = DirectMessage(
        author=User.query.filter(User.id == 3).one(),
        recipient=User.query.filter(User.id == 1).one(),
        title="you'll do something about it",
        content="you betcha",
        encrypted=False,
    )

    db.session.add(message)
    db.session.commit()




    # user_to_reset = User.query.filter(User.name == user).one_or_none()

    # if not user_to_reset:
    #     click.echo(f"could not find user {user}")
    #     return

    # if not user_to_reset.email:
    #     click.echo(f"no email for {user_to_reset.name}")

    # if not user_to_reset.password_reset_token:
    #     click.echo(f"no password reset token for {user_to_reset.name}")

    #     if not click.confirm("would you like to generate one?"):
    #         return

    #     user_to_reset.password_reset_token = (
    #         User.generate_password_reset_token()
    #     )
    #     user_to_reset.password_reset_sent_at = datetime.utcnow()
    #     db.session.add(user_to_reset)
    #     db.session.commit()

    # if click.confirm("would you like to send them the password reset email?"):
    #     send_password_reset_email(user_to_reset)
    #     click.echo(f"sent password reset email to {user_to_reset.name}")
