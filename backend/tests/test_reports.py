from backend.db import SessionLocal
from backend.models import ChatMessage, User

from .conftest import create_group, register


def make_admin(user_id):
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        user.is_admin = True
        db.commit()
    finally:
        db.close()


def test_non_admin_cannot_list_reports(client, unique):
    alice = register(client, f"a_{unique}")
    res = client.get("/api/admin/reports", headers=alice["auth"])
    assert res.status_code == 403


def test_report_chat_message_and_admin_resolves_by_deleting(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    make_admin(bob["id"])

    msg = client.post("/api/chat/global", json={"message": "spam spam spam"}, headers=alice["auth"]).json()

    res = client.post(
        "/api/reports",
        json={"target_type": "chat_message", "target_id": msg["id"], "reason": "spam"},
        headers=bob["auth"],
    )
    assert res.status_code == 200, res.text

    res = client.get("/api/admin/reports", headers=bob["auth"])
    assert res.status_code == 200
    reports = res.json()
    assert len(reports) == 1
    assert "spam spam spam" in reports[0]["target_preview"]
    report_id = reports[0]["id"]

    res = client.post(
        f"/api/admin/reports/{report_id}/resolve", json={"action": "delete_content"}, headers=bob["auth"]
    )
    assert res.status_code == 200, res.text

    # Message is gone; report no longer shows up in the open queue.
    remaining = client.get("/api/chat/global?after_id=0", headers=alice["auth"]).json()
    assert not any(m["id"] == msg["id"] for m in remaining)
    res = client.get("/api/admin/reports", headers=bob["auth"])
    assert res.json() == []


def test_report_group_and_admin_unpublishes_it(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    make_admin(bob["id"])

    group = client.post(
        "/api/groups",
        json={"name": f"Sketchy {unique}", "is_public": True, "category": "general"},
        headers=alice["auth"],
    ).json()

    res = client.post(
        "/api/reports",
        json={"target_type": "group", "target_id": group["id"], "reason": "scammy rules"},
        headers=bob["auth"],
    )
    assert res.status_code == 200, res.text

    reports = client.get("/api/admin/reports", headers=bob["auth"]).json()
    report_id = reports[0]["id"]

    res = client.post(
        f"/api/admin/reports/{report_id}/resolve", json={"action": "unpublish_group"}, headers=bob["auth"]
    )
    assert res.status_code == 200, res.text

    discover = client.get("/api/groups/discover", headers=alice["auth"]).json()
    assert not any(g["id"] == group["id"] for g in discover)


def test_dismiss_report_takes_no_action(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    make_admin(bob["id"])
    msg = client.post("/api/chat/global", json={"message": "totally fine message"}, headers=alice["auth"]).json()

    client.post(
        "/api/reports",
        json={"target_type": "chat_message", "target_id": msg["id"], "reason": "meh"},
        headers=bob["auth"],
    )
    report_id = client.get("/api/admin/reports", headers=bob["auth"]).json()[0]["id"]

    res = client.post(f"/api/admin/reports/{report_id}/resolve", json={"action": "dismiss"}, headers=bob["auth"])
    assert res.status_code == 200

    remaining = client.get("/api/chat/global?after_id=0", headers=alice["auth"]).json()
    assert any(m["id"] == msg["id"] for m in remaining)  # message untouched


def test_mismatched_action_and_target_rejected(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    make_admin(bob["id"])
    msg = client.post("/api/chat/global", json={"message": "hi"}, headers=alice["auth"]).json()
    client.post(
        "/api/reports",
        json={"target_type": "chat_message", "target_id": msg["id"], "reason": "x"},
        headers=bob["auth"],
    )
    report_id = client.get("/api/admin/reports", headers=bob["auth"]).json()[0]["id"]

    res = client.post(
        f"/api/admin/reports/{report_id}/resolve", json={"action": "unpublish_group"}, headers=bob["auth"]
    )
    assert res.status_code == 400


def test_invalid_target_type_rejected(client, unique):
    alice = register(client, f"a_{unique}")
    res = client.post(
        "/api/reports",
        json={"target_type": "user", "target_id": 1, "reason": "x"},
        headers=alice["auth"],
    )
    assert res.status_code == 400


def test_reporting_nonexistent_message_rejected(client, unique):
    alice = register(client, f"a_{unique}")
    res = client.post(
        "/api/reports",
        json={"target_type": "chat_message", "target_id": 999999, "reason": "x"},
        headers=alice["auth"],
    )
    assert res.status_code == 404
