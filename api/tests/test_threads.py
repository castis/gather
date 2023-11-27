import json

from gather.utils import random_string

from conftest import client_with_jwt


def test_empty_thread_list(client):
    resp = client.get(
        "/threads",
        content_type="application/json",
    )
    assert int(resp.status_code) == 200
    assert len(resp.json["threads"]["items"]) == 0


def test_create_thread(client, enabled_user):
    resp = client_with_jwt(client, enabled_user).post(
        "/threads",
        data=json.dumps(
            {
                "title": random_string(),
                "content": "lorem ipsum dolor sit amet",
                "category": "advice",
            }
        ),
        content_type="application/json",
    )
    assert int(resp.status_code) == 200
    assert resp.json["thread"]["id"] == 1
