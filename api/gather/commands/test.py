import boto3
import click
from flask import Blueprint

bp = Blueprint("test", __name__, cli_group="test")
bp.cli.short_help = "Various test operations."


# flask test s3
@bp.cli.command("s3")
def test_s3():
    client = boto3.client("s3")

    avatar = open("/api/tests/media/duckboat.gif", "rb")
    bucket = "yayhooray-avatars"
    key = "test.gif"

    # upload it
    client.upload_fileobj(avatar, bucket, key)

    # ensure its existence
    response = client.head_object(Bucket=bucket, Key=key)
    assert response["ResponseMetadata"]["HTTPStatusCode"] == 200
    click.echo("Uploaded object: %s" % key)

    # delete it
    response = client.delete_object(Bucket=bucket, Key=key)
    assert response["ResponseMetadata"]["HTTPStatusCode"] == 204
    click.echo("Deleted object: %s" % key)

    # ensure its non-existence
    try:
        response = client.head_object(Bucket=bucket, Key=key)
    except client.exceptions.ClientError as e:
        assert e.response["Error"]["Code"] == "404"
        click.echo("Successfully deleted")


# flask test mail
@bp.cli.command("mail")
def test_email():
    from gather.mail import send

    send("castis@duckbo.at", "test subject", "test content goes here")


@bp.cli.command("yh3")
def test_yh3():
    from gather.legacy.services import YH3

    YH3().send_message("castis", "test subject", "test content goes here")
