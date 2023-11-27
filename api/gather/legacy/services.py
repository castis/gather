import json
import os
import pickle
import re
import ssl
from collections.abc import Iterator
from datetime import datetime
from random import randrange
from time import sleep

import click
import requests

requests.packages.urllib3.util.ssl_.DEFAULT_CIPHERS = "DEFAULT@SECLEVEL=1"

import urllib3
from bs4 import BeautifulSoup, ResultSet
from gather.models import Comment, Thread, User, db
from requests import Session
from requests.packages.urllib3.util.retry import Retry

urllib3.disable_warnings()


# "castis is the 1st member of this place and has been here since January 6 2011."
# -> ("1", "January 6 2011")
user_info_parser = re.compile(".+ (\d+|undefined)[\w]{2}.+since (\w+ \d+ \d+).")


# "1 - 100 of 41915 threads" -> (100, 41915)
thread_info_parser = re.compile("1 - (\d+) of (\d+) threads")


categories = {
    "discussions": "discussion",
    "projects": "project",
}

if not bool(os.environ.get("YH3_USERNAME") and os.environ.get("YH3_PASSWORD")):
    click.echo("cant send messages without YH3_USERNAME and YH3_PASSWORD")


class YayHoorayHTTPAdapter(requests.adapters.HTTPAdapter):
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

        return super().init_poolmanager(*args, ssl_context=context, **kwargs)


base_url = "https://www.yayhooray.com"


class Singleton(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(
                *args, **kwargs
            )
        return cls._instances[cls]


pinkies = {
    '<img src="/img/pinkies/11.gif">': "[:)]",
    '<img src="/img/pinkies/01.gif">': "[:(]",
    '<img src="/img/pinkies/05.gif">': "[:D]",
    '<img src="/img/pinkies/07.gif">': "[;)]",
    '<img src="/img/pinkies/08.gif">': "[:P]",
    '<img src="/img/pinkies/14.gif">': "[>|]",
    '<img src="/img/pinkies/10.gif">': "[:[]",
    '<img src="/img/pinkies/03.gif">': "['(]",
    '<img src="/img/pinkies/17.gif">': "[:*]",
    '<img src="/img/pinkies/16.gif">': "[B-]",
    '<img src="/img/pinkies/27.gif">': "[:=]",
    '<img src="/img/pinkies/22.gif">': "[:.]",
    '<img src="/img/pinkies/24.gif">': "[O]",
    '<img src="/img/pinkies/09.gif">': "[8)]",
    '<img src="/img/pinkies/06.gif">': "[:{]",
    '<img src="/img/pinkies/20.gif">': "[:@]",
    '<img src="/img/pinkies/18.gif">': "[%(]",
    '<img src="/img/pinkies/25.gif">': "[><]",
    '<img src="/img/pinkies/23.gif">': "[RR]",
    '<img src="/img/pinkies/26.gif">': "[NH]",
    '<img src="/img/pinkies/21.gif">': "[fbm]",
}.items()

# matches <br> and <br />, maybe with a \r before it
newlines = r"(\r)?<br ?\/?>"


def process_comment(text):
    # convert all html breaks back into just linebreaks
    if "<br" in text:
        text = re.sub(newlines, "\n", text).rstrip()

    # convert pinkie image tags back into the ascii characters
    if '<img src="/img/pinkies/' in text:
        for kwargs in pinkies:
            text = text.replace(*kwargs)

    return text


class YH3:
    __metaclass__ = Singleton

    headers: dict = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/110.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.yayhooray.com",
        "Referer": "https://www.yayhooray.com",
    }

    _session: Session = None
    session_file: str = "/tmp/yh3_cookiejar"

    @property
    def enabled(self) -> bool:
        return bool(
            os.environ.get("YH3_USERNAME") and os.environ.get("YH3_PASSWORD")
        )

    @property
    def session(self) -> Session:
        if self._session:
            return self._session

        self._session = Session()
        self._session.hooks["response"].append(
            # sleep after every request so we dont tank the server
            lambda r, *args, **kwargs: sleep(randrange(3, 5, 1))
        )

        adapter = YayHoorayHTTPAdapter()
        self._session.mount("https://", adapter)
        self._session.headers.update(self.headers)

        # attempt to load cookies
        try:
            with open(self.session_file, "rb") as f:
                click.echo(f"reading from {self.session_file}")
                self._session.cookies.update(pickle.load(f))
        except:
            pass

        # if we dont have any cookies
        if len(self._session.cookies.values()) == 0:
            # log in
            response = self._session.post(
                f"{base_url}/login",
                {
                    "username": os.environ["YH3_USERNAME"],
                    "password": os.environ["YH3_PASSWORD"],
                },
            )

            if response.status_code == 200: # yay
                # save cookies
                with open(self.session_file, "wb") as f:
                    click.echo(f"writing to {self.session_file}")
                    pickle.dump(self._session.cookies, f)
            else:
                raise Exception("could not log in")

        if not self._session.cookies.get("rememberUser"):
            raise Exception("not logged in...?")

        return self._session

    def initial_info(
        self,
    ) -> tuple[
        # thread page size
        int,
        # total threads
        int,
        # last page
        int,
    ]:
        response = self.session.get(base_url)
        main_page_soup = BeautifulSoup(
            response.text,
            "html.parser",
        )

        (thread_page_size, total_threads) = thread_info_parser.match(
            main_page_soup.select(".main-pagination span")[-1].text
        ).groups()
        last_page = main_page_soup.select(".main-pagination a")[-1].text

        return (
            int(thread_page_size),
            int(total_threads),
            int(last_page),
        )

    def get_author(self, name: str) -> User:
        if user := User.query.filter(User.name == name).first():
            return user

        user_page = BeautifulSoup(
            self.session.get(f"{base_url}/user/{name}").text,
            "html.parser",
        )

        (legacy_order, joined) = user_info_parser.match(
            user_page.select(".standard_profile_info_box")[1]
            .text.splitlines()[2]
            .strip()
        ).groups()

        try:
            legacy_order = int(legacy_order)
        except:
            legacy_order = None

        user = User(
            name=name,
            slug=User.generate_slug(name),
            legacy_order=legacy_order,
            created_at=datetime.strptime(joined, "%B %d %Y"),
        )

        db.session.add(user)
        db.session.commit()

        return user

    def get_comment(self, mongo_id: str, thread: Thread) -> Comment:
        response = self.session.get(f"{base_url}/comment/{mongo_id}")

        try:
            comment_data = json.loads(response.content)
        except json.decoder.JSONDecodeError:
            breakpoint()

        if comment := Comment.query.filter_by(mongo_id=mongo_id).first():
            return comment

        author = self.get_author(comment_data.get("postedby"))

        comment = Comment(
            mongo_id=mongo_id,
            thread=thread,
            author=author,
            content=process_comment(comment_data.get("content")),
            points=int(comment_data.get("points", 0)),
            created_at=datetime.fromisoformat(comment_data.get("created")),
        )
        db.session.add(comment)

        thread.comment_count = len(thread.comments)
        thread.last_author = comment.author
        thread.updated_at = comment.created_at
        db.session.add(thread)

        db.session.commit()

        return comment

    def set_title(self, text):
        return self.session.post(
            f"{base_url}/title/edit",
            data={"title": text},
        )

    def get_threads(self, page=1) -> Iterator[tuple[int, Thread]]:
        threads_soup = BeautifulSoup(
            self.session.get(f"{base_url}/sort/-latest/page/{page}").text,
            "html.parser",
        ).select(".thread")

        # for thread_soup in threads_soup[:0:-1]:  # backward
        for thread_soup in threads_soup[1:]:  # forward
            mongo_id = thread_soup.attrs["id"][7:]
            comment_count = int(thread_soup.select_one(".four").text)

            if thread := Thread.query.filter_by(mongo_id=mongo_id).first():
                yield (comment_count, thread)
                continue

            header = thread_soup.select_one(".subject-text a")

            category = (
                thread_soup.select_one(".one .category")
                .text.splitlines()[1]
                .strip()
                .lower()
            )

            author = self.get_author(
                thread_soup.select_one(".two .username a").text
            )

            thread = Thread(
                mongo_id=mongo_id,
                title=header.text,
                slug=Thread.generate_slug(header.text),
                category=categories.get(category, category),
                legacy_slug=header.attrs["href"].split("/", 2)[2],
                nsfw="nsfw" in thread_soup.attrs["class"],
                author=author,
            )

            db.session.add(thread)
            db.session.commit()

            yield (comment_count, thread)

    def get_comment_soup(self, thread: Thread, page: int = 1) -> ResultSet:
        url = f"{base_url}/thread/{thread.legacy_slug}/page/{page}"
        return BeautifulSoup(
            self.session.get(url).text,
            "html.parser",
        ).select("#thread .comment:not(.later-comment)")

    def add_comment(self, thread, content):
        return self.session.post(
            f"{base_url}/thread/{thread.legacy_slug}",
            data={
                "threadid": thread.mongo_id,
                "threadurlname": thread.legacy_slug,
                "content": content,
            },
        )

    def send_message(
        self,
        recipient: str,
        subject: str,
        content: str,
    ):
        if self.enabled:
            return self.session.post(
                f"{base_url}/message/send",
                data={
                    "recipients": recipient,
                    "subject": subject,
                    "content": content,
                },
            )

        click.echo(f"message to {recipient}:\n{subject}\n{content}")
        return None
