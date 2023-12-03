# import json
import os
import pickle
import re
import ssl

import click
import requests
from bs4 import BeautifulSoup, ResultSet
from requests import Session
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

requests.packages.urllib3.util.ssl_.DEFAULT_CIPHERS = "DEFAULT@SECLEVEL=1"

from gather.models import Comment, Thread, User, db

# "castis is the 1st member of this place and has been here since January 6 2011."
# -> ("1", "January 6 2011")
user_info_parser = re.compile(
    r".+ (\d+|undefined)[\w]{2}.+since (\w+ \d+ \d+)."
)

if not bool(os.environ.get("YH3_USERNAME") and os.environ.get("YH3_PASSWORD")):
    click.echo("the fires of yh3 are not lit")


class Singleton(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(
                *args, **kwargs
            )
        return cls._instances[cls]


class YayHoorayHTTPAdapter(HTTPAdapter):
    def __init__(self, *args, **kwargs):
        super().__init__(
            max_retries=Retry(
                total=3,
                read=3,
                connect=1,
                backoff_factor=0.3,
                status_forcelist=(500, 502, 504),
            )
        )

    def init_poolmanager(self, *args, **kwargs):
        context = ssl.create_default_context()
        # old cipher
        context.set_ciphers("DEFAULT@SECLEVEL=0")
        # broken cert
        context.check_hostname = False
        context.verify_mode = ssl.CERT_OPTIONAL

        kwargs["ssl_context"] = context
        return super().init_poolmanager(*args, **kwargs)


base_url = "https://www.yayhooray.com"


class YH3(metaclass=Singleton):
    headers: dict = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/110.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.yayhooray.com",
        "Referer": "https://www.yayhooray.com",
    }

    session: Session = None
    cookie_jar: str = "/tmp/yh3_cookiejar"
    logged_in: bool = False

    def __init__(
        self,
        session: Session = None,
        adapter: HTTPAdapter = None,
    ):
        self.session = session or Session()
        adapter = adapter or YayHoorayHTTPAdapter()
        self.session.mount("https://", adapter)
        self.session.headers.update(self.headers)

        # load cookies
        try:
            with open(self.cookie_jar, "rb") as f:
                click.echo(f"reading from {self.cookie_jar}")
                self.session.cookies.update(pickle.load(f))
        except:
            pass

        if (
            self.session.cookies.get("rememberUser")
            == os.environ["YH3_USERNAME"]
        ):
            self.logged_in = True
            return  # no further action needed

        response = self.session.post(
            f"{base_url}/login",
            {
                "username": os.environ["YH3_USERNAME"],
                "password": os.environ["YH3_PASSWORD"],
            },
        )

        if response.status_code == 200:  # yay
            self.logged_in = True
            # save cookies
            with open(self.cookie_jar, "wb") as f:
                click.echo(f"writing to {self.cookie_jar}")
                pickle.dump(response.cookies, f)
        else:
            click.echo("could not log in")
            self.logged_in = False

    def send_message(
        self,
        recipient: str,
        subject: str,
        content: str,
    ):
        if not self.logged_in:
            click.echo(f"message to {recipient}:\n{subject}\n{content}")

        return self.session.post(
            f"{base_url}/message/send",
            data={
                "recipients": recipient,
                "subject": subject,
                "content": content,
            },
        )

    def get_user_info(self, name: str) -> tuple[int, str]:
        user_page = BeautifulSoup(
            self.session.get(f"{base_url}/user/{name}").text,
            "html.parser",
        )

        (legacy_order, joined) = user_info_parser.match(
            user_page.select(".standard_profile_info_box")[1]
            .text.splitlines()[2]
            .strip()
        ).groups()

        return (
            int(legacy_order) if legacy_order.isdigit() else None,
            joined,
        )
