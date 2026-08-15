import os
import tempfile

import pytest

# backend.db reads DATABASE_URL at import time, so this has to happen before
# any "import backend..." anywhere -- including transitively, which is why
# it's here in conftest rather than in a fixture.
_tmp_fd, _tmp_path = tempfile.mkstemp(suffix=".db")
os.close(_tmp_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_path}"
os.environ["JWT_SECRET"] = "test-secret-not-for-production"

from fastapi.testclient import TestClient  # noqa: E402

from backend.app import app  # noqa: E402
from backend.rate_limit import _attempts  # noqa: E402

_counter = {"n": 0}


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def unique():
    """A short unique string per test call, so tests can run against a
    shared DB (fast, no per-test schema reset) without colliding on
    usernames/invite-dependent state."""
    _counter["n"] += 1
    return f"t{_counter['n']}"


def register(client, username, display_name=None):
    # The rate limiter is keyed by client IP, and every test in this suite
    # shares the same fake TestClient IP -- without this, tests interfere
    # with each other's registration/login budgets in file-order-dependent
    # ways. The two tests that specifically exercise rate limiting manage
    # their own clearing around the behavior they're testing.
    _attempts.clear()
    res = client.post(
        "/api/register",
        json={
            "username": username, "password": "password123", "display_name": display_name or username,
            "accepted_terms": True,
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    return {
        "token": data["access_token"], "id": data["user_id"], "username": data["username"],
        "recovery_code": data["recovery_code"], "auth": {"Authorization": f"Bearer {data['access_token']}"},
    }


def create_group(client, user, name):
    res = client.post("/api/groups", json={"name": name}, headers=user["auth"])
    assert res.status_code == 200, res.text
    return res.json()


def join_group(client, user, invite_code):
    res = client.post("/api/groups/join", json={"invite_code": invite_code}, headers=user["auth"])
    assert res.status_code == 200, res.text
    return res.json()


def topup(client, user, group_id, amount, approver):
    res = client.post(f"/api/groups/{group_id}/topup-requests", json={"amount": amount}, headers=user["auth"])
    assert res.status_code == 200, res.text
    req_id = res.json()["id"]
    res = client.post(f"/api/groups/{group_id}/topup-requests/{req_id}/approve", headers=approver["auth"])
    assert res.status_code == 200, res.text
    return res.json()
