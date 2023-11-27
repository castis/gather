import boto3
import click
from botocore.exceptions import ClientError
from gather.config import MODE, URL
from gather.models import User


def send(user: User, subject: str, content: str):
    if MODE == "development":
        click.echo(f"mail to {user.email}:\n{subject}\n{content}")
        return

    client = boto3.client("ses", region_name="us-east-1")

    try:
        client.send_email(
            Destination={
                "ToAddresses": [user.email],
            },
            Message={
                "Body": {
                    "Html": {
                        "Charset": "UTF-8",
                        "Data": "<br />\n".join(content.split("\n")),
                    },
                    "Text": {
                        "Charset": "UTF-8",
                        "Data": content,
                    },
                },
                "Subject": {
                    "Charset": "UTF-8",
                    "Data": subject,
                },
            },
            Source="yh@duckbo.at",
        )
    except ClientError as e:
        click.echo(e.response["Error"]["Message"])


def send_password_reset_email(user):
    link = f"{URL}/new_password/{user.password_reset_token}"
    content = f"Hi {user.name},\n\nHead here to reset your password\n\n{link}\n\nLove,\nThe YH Robot"

    return send(
        user=user,
        subject="Is this really you?",
        content=content,
    )


def send_email_verification_email(user):
    link = f"{URL}/verify_email/{user.email_reset_token}"
    content = f"Hello {user.name}!\n\nVerify you email address here\n\n{link}\n\nLove,\nThe YH Robot"

    return send(
        user=user,
        subject="Yay new email!",
        content=content,
    )
