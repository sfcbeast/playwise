from .conftest import register


def test_security_headers_present_on_every_response(client):
    res = client.get("/api/push/vapid-public-key")
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["x-frame-options"] == "DENY"
    assert res.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "strict-transport-security" in res.headers
    csp = res.headers["content-security-policy"]
    assert "default-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp
    assert "script-src 'self'" in csp
    assert "unsafe-inline" not in csp.split("script-src")[1].split(";")[0]


def test_logout_everywhere_invalidates_the_calling_token(client, unique):
    alice = register(client, f"a_{unique}")

    res = client.get("/api/groups", headers=alice["auth"])
    assert res.status_code == 200

    res = client.post("/api/account/logout-everywhere", headers=alice["auth"])
    assert res.status_code == 200, res.text

    # The very token used to call logout-everywhere no longer works.
    res = client.get("/api/groups", headers=alice["auth"])
    assert res.status_code == 401


def test_logout_everywhere_does_not_affect_other_users(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")

    client.post("/api/account/logout-everywhere", headers=alice["auth"])

    res = client.get("/api/groups", headers=bob["auth"])
    assert res.status_code == 200


def test_password_reset_invalidates_old_token(client, unique):
    alice = register(client, f"a_{unique}")
    old_token_headers = alice["auth"]

    res = client.post(
        "/api/reset-password",
        json={"username": f"a_{unique}", "recovery_code": alice["recovery_code"], "new_password": "newpassword456"},
    )
    assert res.status_code == 200, res.text

    # The token issued before the reset is dead now.
    res = client.get("/api/groups", headers=old_token_headers)
    assert res.status_code == 401

    # But logging in fresh with the new password works fine.
    login_res = client.post("/api/login", json={"username": f"a_{unique}", "password": "newpassword456"})
    new_auth = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    res = client.get("/api/groups", headers=new_auth)
    assert res.status_code == 200


def test_fresh_login_after_logout_everywhere_works_again(client, unique):
    alice = register(client, f"a_{unique}")
    client.post("/api/account/logout-everywhere", headers=alice["auth"])

    res = client.post("/api/login", json={"username": f"a_{unique}", "password": "password123"})
    assert res.status_code == 200
    new_token = res.json()["access_token"]

    res = client.get("/api/groups", headers={"Authorization": f"Bearer {new_token}"})
    assert res.status_code == 200
