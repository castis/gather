from random import choice, randrange

from gather.models import Comment, Thread, ThreadCategories, User, db
from gather.utils import random_string

from . import commands


# flask yay fixtures
@commands.cli.command("fixtures")
def fixtures():
    password = "pinkie"
    users = []
    # irl most arent nsfw
    nsfw_choices = [True, False, False, False, False]
    for i in range(10):
        name = random_string(numwords=1)
        user = User(
            name=name,
            email=f"{name}@example.com",
            slug=User.generate_slug(name),
        )
        user.set_password(password)
        users.append(user)
        db.session.add(user)
    db.session.commit()

    categories = list(ThreadCategories.__members__)
    for i in range(randrange(40, 50, 1)):
        thread_author = choice(users)
        thread_last_author = choice(users)
        title = random_string(numwords=4, delimiter=" ")
        thread = Thread(
            author=thread_author,
            title=title,
            slug=Thread.generate_slug(title),
            category=choice(categories),
            nsfw=choice(nsfw_choices),
        )
        db.session.add(thread)
        db.session.add(
            Comment(
                author=thread_author,
                thread=thread,
                content=random_string(numwords=8, delimiter=" "),
            )
        )
        last_author = None
        comments_to_make = randrange(1, 20, 1)
        for j in range(comments_to_make):
            last_author = choice(users)
            db.session.add(
                Comment(
                    author=last_author,
                    thread=thread,
                    content=random_string(numwords=8, delimiter=" "),
                )
            )
        thread.last_author = last_author
        thread.comment_count = comments_to_make
        db.session.add(thread)
        db.session.commit()
