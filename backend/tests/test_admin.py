from .conftest import create_group, register
from .test_reports import make_admin


def test_non_admin_cannot_see_stats_users_or_groups(client, unique):
    alice = register(client, f"a_{unique}")
    assert client.get("/api/admin/stats", headers=alice["auth"]).status_code == 403
    assert client.get("/api/admin/users", headers=alice["auth"]).status_code == 403
    assert client.get("/api/admin/groups", headers=alice["auth"]).status_code == 403


def test_stats_reflect_real_counts(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    make_admin(bob["id"])
    create_group(client, alice, f"Stats Group {unique}")

    before = client.get("/api/admin/stats", headers=bob["auth"]).json()

    charlie = register(client, f"c_{unique}")
    create_group(client, charlie, f"Another Stats Group {unique}")

    after = client.get("/api/admin/stats", headers=bob["auth"]).json()
    assert after["total_users"] == before["total_users"] + 1
    assert after["total_groups"] == before["total_groups"] + 1


def test_users_list_includes_group_count_and_is_ordered_newest_first(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    make_admin(bob["id"])
    create_group(client, alice, f"Membership Group {unique}")

    users = client.get("/api/admin/users?limit=200", headers=bob["auth"]).json()
    by_id = {u["id"]: u for u in users}
    assert by_id[alice["id"]]["group_count"] == 1
    # bob is an admin but hasn't joined anything.
    assert by_id[bob["id"]]["group_count"] == 0
    assert by_id[bob["id"]]["is_admin"] is True
    # Most-recently-registered user (bob) should sort before alice.
    ids_in_order = [u["id"] for u in users]
    assert ids_in_order.index(bob["id"]) < ids_in_order.index(alice["id"])


def test_groups_list_includes_leader_and_member_count(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    make_admin(bob["id"])
    group = create_group(client, alice, f"Admin Visible Group {unique}")
    client.post("/api/groups/join", json={"invite_code": group["invite_code"]}, headers=bob["auth"])

    groups = client.get("/api/admin/groups?limit=200", headers=bob["auth"]).json()
    row = next(g for g in groups if g["id"] == group["id"])
    assert row["leader_display_name"] == alice["username"]
    assert row["member_count"] == 2


def test_filing_a_report_notifies_admins_without_error(client, unique):
    # No push subscription is registered for bob, so notify_user() should
    # just no-op silently (it never raises) -- this is really testing that
    # create_report doesn't blow up once the notify call is added.
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    make_admin(bob["id"])
    msg = client.post("/api/chat/global", json={"message": "hello"}, headers=alice["auth"]).json()

    res = client.post(
        "/api/reports",
        json={"target_type": "chat_message", "target_id": msg["id"], "reason": "test"},
        headers=alice["auth"],
    )
    assert res.status_code == 200, res.text

    # Clean up -- other tests in this shared-DB session assume they're the
    # only source of open reports (they read reports[0] after creating
    # their own), so leaving this one open would leak into their queue.
    report_id = client.get("/api/admin/reports", headers=bob["auth"]).json()[0]["id"]
    client.post(f"/api/admin/reports/{report_id}/resolve", json={"action": "dismiss"}, headers=bob["auth"])
