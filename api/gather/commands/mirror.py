# import os
# import sys
# import time
# from datetime import datetime, timedelta
# from math import ceil
# from time import sleep
# # from typing import Optional

# import click
# # import openai
# from flask import Blueprint
# from gather.commands.bot import behaviors
# from gather.legacy.services import YH3
# from gather.models import Comment, Thread, User, db

# TIMEOUT = 60 * 10  # seconds

# bp = Blueprint("mirror", __name__, cli_group="mirror")
# bp.cli.short_help = "Gradually create a mirror of YH 3"


# # flask mirror yh3
# @bp.cli.command("yh3")
# @click.option(
#     "-t",
#     "--timeout",
#     "timeout",
#     default=TIMEOUT,
#     help="Only run for this many seconds.",
# )
# @click.option(
#     "-p",
#     "--page",
#     "starting_thread_page",
#     default=1,
#     help="When reading a thread, start at this page. Only useful if you're restarting the process and setting this temporarily to the last page you saw.",
# )
# @click.option(
#     "-l",
#     "--live",
#     "live",
#     is_flag=True,
#     default=False,
#     help="Pause for a moment and restart when we reach a thread we fully have.",
# )
# def mirror_yh3(
#     timeout,
#     starting_thread_page,
#     live,
# ):
#     process_started = time.time()

#     yh3 = YH3(wait=True)

#     click.echo("getting initial info...")
#     (
#         thread_page_size,
#         total_threads,
#         last_page,
#     ) = yh3.initial_info()

#     known_threads = Thread.query.filter(Thread.comment_count > 0).count()

#     completeness = round((known_threads / total_threads) * 100, 2)
#     click.echo(
#         f"archived {known_threads}/{total_threads} threads ({completeness}%)"
#     )

#     # each thread page
#     for page in range(starting_thread_page, last_page + 1, 1):
#         click.echo(f"thread page {page}/{last_page}")

#         # each thread
#         for incoming_count, thread in yh3.get_threads(page=page):
#             known_count = len(thread.comments)

#             # we already have all the comments we should
#             if incoming_count == known_count:
#                 # if we're on live mode, we've reached the first thread
#                 # that we 100% know about already, so just pause and restart
#                 if live:
#                     click.echo("Sleeping for a bit")
#                     sleep(15)
#                     os.execl(sys.executable, sys.executable, *sys.argv)

#                 click.echo(click.style(thread.legacy_slug, fg="green"))
#                 continue

#             click.echo(f"{thread.legacy_slug} {thread.mongo_id[:8]}", nl=False)
#             click.echo(f" {known_count}/{incoming_count}")

#             starting_page = ceil(known_count / thread_page_size)
#             if known_count % thread_page_size == 0:
#                 starting_page += 1

#             comment_pages = ceil(incoming_count / thread_page_size)

#             # each comment page
#             for comment_page in range(starting_page, comment_pages + 1, 1):
#                 click.echo(f"comment page {comment_page}/{comment_pages}")

#                 # each comment
#                 for raw_comment in yh3.get_comment_soup(
#                     thread=thread,
#                     page=comment_page,
#                 ):
#                     try:
#                         mongo_id = raw_comment.attrs["id"][8:]
#                     except KeyError:
#                         breakpoint()
#                         continue

#                     # if this already exists in the database, do nothing
#                     if Comment.query.filter_by(mongo_id=mongo_id).first():
#                         continue

#                     known_count += 1

#                     click.echo(f"{known_count}/{incoming_count}...", nl=False)

#                     comment = yh3.get_comment(
#                         mongo_id=mongo_id,
#                         thread=thread,
#                     )

#                     if known_count == 1:
#                         thread.created_at = comment.created_at
#                         db.session.add(thread)
#                         db.session.commit()

#                     if live and comment.updated_at > datetime.now() - timedelta(
#                         minutes=5
#                     ):
#                         for behavior in behaviors:
#                             if comment.content.startswith(
#                                 f"/{behavior.token} "
#                             ):
#                                 if response := behavior.process(comment):
#                                     yh3.add_comment(comment.thread, response)
#                                 break

#                     click.echo(
#                         click.style(f" {comment.author.name}", fg="blue")
#                     )

#                     if time.time() > process_started + timeout:
#                         click.echo(f"timed out after {timeout} seconds")
#                         os.execl(sys.executable, sys.executable, *sys.argv)
