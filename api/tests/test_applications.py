# import json
# import pdb

# from gather.models import Applicant, VoteType
# from gather.utils import random_string

# from conftest import client_with_jwt


# def test_empty_applicant_list(client, enabled_user):
#     resp = client_with_jwt(client, enabled_user).get(
#         "/api/applications",
#         content_type="application/json",
#     )
#     assert int(resp.status_code) == 200
#     assert len(resp.json["items"]) == 0


# def test_bad_application_info(client):
#     good_name = random_string(numwords=1)
#     good_email = f"{good_name}@example.com"
#     good_application = "party!"

#     def bad_application_attempt(
#         field, name=good_name, email=good_email, application=good_application
#     ):
#         resp = client.post(
#             "/api/applications",
#             data=json.dumps(
#                 {
#                     "name": name,
#                     "email": email,
#                     "application": application,
#                 }
#             ),
#             content_type="application/json",
#         )
#         assert int(resp.status_code) == 422
#         assert len(resp.json["msg"]) > 0
#         assert resp.json["fields"].get(field, False) is not False

#     for field, values in {
#         "name": ["a", "!@#%",],
#         "email": ["notcomplete", "no@tldext",],
#         # "application": [],
#     }.items():
#         for v in values:
#             bad_application_attempt(field, **{field: v})


# def test_create_application(client, enabled_user):
#     name = random_string(numwords=1)
#     resp = client_with_jwt(client, enabled_user).post(
#         "/api/applications",
#         data=json.dumps(
#             {
#                 "name": name,
#                 "email": f"{name}@example.com",
#                 "application": "HAAAAAANDS",
#             }
#         ),
#         content_type="application/json",
#     )
#     assert int(resp.status_code) == 200
#     assert resp.json["msg"] == "ok"


# def test_application_vote(client, enabled_user, applicant):
#     jwt_client = client_with_jwt(client, enabled_user)
#     resp = jwt_client.put(
#         "/api/applications/vote",
#         data=json.dumps(
#             {
#                 "name": applicant.name,
#                 "type": "yay",
#             }
#         ),
#         content_type="application/json",
#     )
#     assert int(resp.status_code) == 200
#     assert resp.json["msg"] == "ok"

#     new_applicant = Applicant.query.filter_by(name=applicant.name).first()
#     assert new_applicant.votes[0].user == enabled_user
#     assert new_applicant.votes[0].type == VoteType.yay

#     resp = jwt_client.put(
#         "/api/applications/vote",
#         data=json.dumps(
#             {
#                 "name": applicant.name,
#                 "type": "nay",
#             }
#         ),
#         content_type="application/json",
#     )
#     assert int(resp.status_code) == 200
#     assert resp.json["msg"] == "ok"

#     new_applicant = Applicant.query.filter_by(name=applicant.name).first()
#     assert new_applicant.votes[0].type == VoteType.nay
