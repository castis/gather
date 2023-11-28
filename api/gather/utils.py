from flask import request, current_app
from xkcdpass import xkcd_password
from flask_caching import Cache
from werkzeug.local import LocalProxy

logger = LocalProxy(lambda: current_app.logger)

cache = Cache()


def encode_emojis(text):
    return text.replace("[>|]", "[&gt;|]").replace("[><]", "[&gt;&lt;]")



def get_page():
    try:
        return int(request.args.get("page"))
    except (ValueError, TypeError):
        return 1


xkcd_words = xkcd_password.generate_wordlist(
    wordfile=xkcd_password.locate_wordfile(), min_length=5, max_length=7
)


def random_string(numwords=4, delimiter="-", **kwargs):
    return xkcd_password.generate_xkcdpassword(
        xkcd_words,
        numwords=numwords,
        delimiter=delimiter,
        **kwargs,
    )
