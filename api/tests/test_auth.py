import json

from conftest import client_with_jwt
from gather.config import JWT_ACCESS_COOKIE_NAME


def test_not_logged_in(client):
    resp = client.post("/auth/ping")
    assert int(resp.status_code) == 401
    assert resp.text == ""


# def test_login(client, enabled_user):
#     resp = client.post(
#         "/auth/login",
#         data=json.dumps(
#             {
#                 "name": enabled_user.name,
#                 "password": "party!",
#             }
#         ),
#         content_type="application/json",
#     )
#     assert resp.json["name"] == enabled_user.name
#     assert resp.headers.get("Set-Cookie").startswith(
#         f"{JWT_ACCESS_COOKIE_NAME}="
#     )

#     resp = client_with_jwt(client, enabled_user).get(
#         "/auth/me",
#         content_type="application/json",
#     )
#     assert resp.json["user"]["name"] == enabled_user.name


# def test_logout(client, enabled_user):
#     _client = client_with_jwt(client, enabled_user)

#     resp = _client.get(
#         "/auth/me",
#         content_type="application/json",
#     )
#     assert resp.json["user"]["name"] == enabled_user.name

#     resp = _client.post(
#         "/auth/logout",
#         content_type="application/json",
#     )
#     assert resp.status_code == 204
#     assert resp.text == ""

#     resp = _client.get(
#         "/auth/me",
#         content_type="application/json",
#     )
#     assert resp.json["msg"].startswith("Missing cookie ")
