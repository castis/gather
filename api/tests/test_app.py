
def test_healthcheck(client):
    resp = client.get("/health")
    assert int(resp.status_code) == 200

def test_status(client):
    resp = client.get("/status")
    assert int(resp.status_code) == 200
    assert resp.json.get("current_time", False) is not False
