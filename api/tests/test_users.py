
# def test_empty_user_list(client):
#     resp = client.get(
#         "/api/users",
#         content_type="application/json",
#     )
#     assert int(resp.status_code) == 200
#     assert len(resp.json["items"]) == 0
