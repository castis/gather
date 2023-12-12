import os
import sys

import click
from cryptography.fernet import Fernet, InvalidToken
from flask import Blueprint

bp = Blueprint("auth", __name__, cli_group="auth")
bp.cli.short_help = "Various auth operations."

# echo "hello world" | flask auth encrypt | flask auth decrypt


@bp.cli.command("keygen")
def keygen():
    key = Fernet.generate_key()
    click.echo(key)


def get_key(key):
    key = key or os.environ.get("FERNET_KEY")
    assert key
    return key


def get_text(text):
    text = text or sys.stdin.read().strip()
    assert text
    return text.encode("utf-8")


# flask auth encrypt "hello world"
@bp.cli.command("encrypt")
@click.argument("text", required=False, default=None)
@click.argument("key", required=False, default=None)
def encrypt(text, key: str = None):
    try:
        click.echo(Fernet(get_key(key)).encrypt(get_text(text)))
    except ValueError as e:
        click.echo(e)


# flask auth decrypt gAAAA...AdA==
@bp.cli.command("decrypt")
@click.argument("text", required=False, default=None)
@click.argument("key", required=False, default=None)
def decrypt(text, key: str = None):
    try:
        click.echo(Fernet(get_key(key)).decrypt(get_text(text)))
    except InvalidToken:
        click.echo("invalid encrypted string")
    except Exception as e:
        click.echo(e)
