import click
from models import Applicant, db

from . import commands


def arbiter(applicant):
    # breakpoint()
    return len(applicant.votes) > 0


# flask app applications
@commands.cli.command("applications")
def process_applications():
    for applicant in Applicant.query.distinct():
        if arbiter(applicant):
            # User
            db.session.add(applicant)
            try:
                db.session.commit()
            except Exception:
                click.echo(f"could not save {applicant.name}")
                applicant.invite()
            click.echo(f"Inviting {applicant.name}")
