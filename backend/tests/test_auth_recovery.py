from backend.rate_limit import _attempts

from .conftest import register


def test_register_returns_a_recovery_code(client, unique):
    user = register(client, f"a_{unique}")
    assert user["recovery_code"]
    assert len(user["recovery_code"].split("-")) == 3


def test_login_does_not_return_a_recovery_code(client, unique):
    register(client, f"a_{unique}")
    res = client.post("/api/login", json={"username": f"a_{unique}", "password": "password123"})
    assert res.json()["recovery_code"] is None


def test_reset_password_with_correct_code_succeeds(client, unique):
    user = register(client, f"a_{unique}")
    code = user["recovery_code"]

    res = client.post(
        "/api/reset-password",
        json={"username": f"a_{unique}", "recovery_code": code, "new_password": "newpassword456"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["recovery_code"] is not None
    assert res.json()["recovery_code"] != code  # rotated

    # Old password no longer works, new one does.
    res = client.post("/api/login", json={"username": f"a_{unique}", "password": "password123"})
    assert res.status_code == 401
    res = client.post("/api/login", json={"username": f"a_{unique}", "password": "newpassword456"})
    assert res.status_code == 200


def test_reset_password_with_wrong_code_rejected(client, unique):
    register(client, f"a_{unique}")
    res = client.post(
        "/api/reset-password",
        json={"username": f"a_{unique}", "recovery_code": "WRONG-CODE-HERE", "new_password": "newpassword456"},
    )
    assert res.status_code == 400


def test_recovery_code_is_single_use(client, unique):
    user = register(client, f"a_{unique}")
    code = user["recovery_code"]

    res = client.post(
        "/api/reset-password",
        json={"username": f"a_{unique}", "recovery_code": code, "new_password": "firstreset123"},
    )
    assert res.status_code == 200

    # Reusing the same (now-rotated-away) code fails.
    _attempts.clear()
    res = client.post(
        "/api/reset-password",
        json={"username": f"a_{unique}", "recovery_code": code, "new_password": "secondreset456"},
    )
    assert res.status_code == 400


def test_regenerate_recovery_code_invalidates_old_one(client, unique):
    user = register(client, f"a_{unique}")
    old_code = user["recovery_code"]

    res = client.post("/api/account/recovery-code", headers=user["auth"])
    assert res.status_code == 200
    new_code = res.json()["recovery_code"]
    assert new_code != old_code

    # Old code no longer works for reset.
    res = client.post(
        "/api/reset-password",
        json={"username": user["username"], "recovery_code": old_code, "new_password": "whatever123"},
    )
    assert res.status_code == 400

    # New code does.
    _attempts.clear()
    res = client.post(
        "/api/reset-password",
        json={"username": f"a_{unique}", "recovery_code": new_code, "new_password": "whatever123"},
    )
    assert res.status_code == 200, res.text
