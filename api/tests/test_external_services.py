import os
from unittest.mock import mock_open, patch, MagicMock

import pytest
from gather.legacy.services import YH3, Singleton, base_url


class ResponseMock:
    def __init__(self, status_code):
        self.status_code = status_code
        self.cookies = {}
        self.text = ""


@pytest.fixture
def mock_session():
    with patch(
        "gather.legacy.services.requests.Session",
        autospec=True,
    ) as mock:
        mock.post.return_value = ResponseMock(200)
        mock.headers = {}
        mock.cookies = MagicMock()

        yield mock


@pytest.fixture
def mock_adapter():
    with patch(
        "gather.legacy.services.YayHoorayHTTPAdapter",
        autospec=True,
    ) as mock:
        yield mock


@pytest.fixture
def mock_file_io():
    with patch("builtins.open", mock_open(read_data="mock")) as mock_file:
        yield mock_file


@pytest.fixture
def mock_environment():
    os.environ["YH3_USERNAME"] = "testuser"
    os.environ["YH3_PASSWORD"] = "testpass"

    yield
    del os.environ["YH3_USERNAME"]
    del os.environ["YH3_PASSWORD"]


def test_singleton(mock_session, mock_adapter, mock_file_io, mock_environment):
    Singleton._instances.clear()
    kwargs = dict(
        session=mock_session,
        adapter=mock_adapter,
    )

    instance1 = YH3(**kwargs)
    instance2 = YH3(**kwargs)
    instance3 = YH3(**kwargs)

    assert len(Singleton._instances.keys()) == 1
    assert instance1 is instance2 is instance3
    assert mock_session.post.call_args[0][0].endswith("/login")
    assert mock_session.post.call_count == 1


def test_general(
    mock_session,
    mock_adapter,
    mock_file_io,
    mock_environment,
):
    Singleton._instances.clear()

    YH3(session=mock_session, adapter=mock_adapter)

    # properly sets headers
    assert sorted(
        [
            "User-Agent",
            "Accept",
            "Content-Type",
            "Origin",
            "Referer",
        ]
    ) == sorted(mock_session.headers.keys())
    # mounts our adapter
    mock_session.mount.assert_called_with("https://", mock_adapter)

    mock_session.post.assert_called_with(
        f"{base_url}/login",
        {
            "username": os.environ["YH3_USERNAME"],
            "password": os.environ["YH3_PASSWORD"],
        },
    )

    # stored some cookies
    mock_file_io.assert_called_with("/tmp/yh3_cookiejar", "wb")


def test_bad_env(
    mock_session,
    mock_adapter,
    mock_file_io,
):
    Singleton._instances.clear()

    with pytest.raises(Exception):
        YH3()


def test_messages(
    mock_session,
    mock_adapter,
    mock_file_io,
    mock_environment,
):
    Singleton._instances.clear()

    YH3(
        session=mock_session,
        adapter=mock_adapter,
    ).send_message("username", "subject", "content")

    mock_session.post.assert_called_with(
        f"{base_url}/message/send",
        {
            "recipients": "username",
            "subject": "subject",
            "content": "content",
        },
    )


def test_user_info(mock_session, mock_adapter, mock_file_io, mock_environment):
    Singleton._instances.clear()

    instance = YH3(
        session=mock_session,
        adapter=mock_adapter,
    )

    mock_session.get.return_value.text = """
        <div class="standard_profile_info_box"></div>
        <div id="stats" class="standard_profile_info_box">
            <h3>Stats</h3>
            soandso is the 111th member of this place and has been here since January 1 1970.
            Since then, soandso has posted 0 threads and 0 comments.
            That's a total of 0 posts per day.
            soandso last logged in on December 3 2023 at 12:00 pm. Currently, soandso is a friend of 0 users.
            soandso has 111 points and can spend another point right now.
        </div>
    """

    (legacy_order, joined) = instance.get_user_info("castis")

    assert legacy_order == 111
    assert joined == "January 1 1970"
