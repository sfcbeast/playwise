from backend.db import SessionLocal
from backend.models import User

from .conftest import create_group, join_group, register, topup


def make_superadmin(user_id):
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        user.is_admin = True
        user.is_superadmin = True
        db.commit()
    finally:
        db.close()


def make_admin_only(user_id):
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        user.is_admin = True
        db.commit()
    finally:
        db.close()


def test_superadmin_can_view_group_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"View Group {unique}")

    res = client.get(f"/api/groups/{group['id']}", headers=god["auth"])
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["is_member"] is False
    assert body["my_balance"] == 0
    assert any(m["user_id"] == alice["id"] for m in body["members"])


def test_plain_admin_without_superadmin_still_cannot_view_unjoined_group(client, unique):
    alice = register(client, f"a_{unique}")
    admin_only = register(client, f"ao_{unique}")
    make_admin_only(admin_only["id"])
    group = create_group(client, alice, f"Admin Only Group {unique}")

    res = client.get(f"/api/groups/{group['id']}", headers=admin_only["auth"])
    assert res.status_code == 403


def test_superadmin_can_resolve_bet_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"Resolve Group {unique}")
    join_group(client, bob, group["invite_code"])
    topup(client, alice, group["id"], 500, alice)
    topup(client, bob, group["id"], 500, alice)

    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q?", "options": ["Yes", "No"]}, headers=alice["auth"],
    ).json()
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 100}, headers=alice["auth"])
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 1, "amount": 100}, headers=bob["auth"])

    res = client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": 0}, headers=god["auth"])
    assert res.status_code == 200, res.text

    alice_balance = client.get(f"/api/groups/{group['id']}", headers=alice["auth"]).json()["my_balance"]
    assert alice_balance == 500 - 100 + 200  # started 500, staked 100, won the full 200 pool


def test_superadmin_can_approve_topup_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"Topup Group {unique}")

    req = client.post(f"/api/groups/{group['id']}/topup-requests", json={"amount": 250}, headers=alice["auth"]).json()
    res = client.post(f"/api/groups/{group['id']}/topup-requests/{req['id']}/approve", headers=god["auth"])
    assert res.status_code == 200, res.text

    balance = client.get(f"/api/groups/{group['id']}", headers=alice["auth"]).json()["my_balance"]
    assert balance == 250


def test_superadmin_can_kick_member_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"Kick Group {unique}")
    join_group(client, bob, group["invite_code"])

    res = client.post(f"/api/groups/{group['id']}/kick/{bob['id']}", headers=god["auth"])
    assert res.status_code == 200, res.text

    members = client.get(f"/api/groups/{group['id']}", headers=alice["auth"]).json()["members"]
    assert not any(m["user_id"] == bob["id"] for m in members)


def test_superadmin_can_edit_group_settings_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"Settings Group {unique}")

    res = client.patch(
        f"/api/groups/{group['id']}/settings",
        json={"is_public": True, "category": "general", "rules": "be nice", "starting_balance": 100},
        headers=god["auth"],
    )
    assert res.status_code == 200, res.text

    detail = client.get(f"/api/groups/{group['id']}", headers=alice["auth"]).json()
    assert detail["is_public"] is True
    assert detail["category"] == "general"


def test_superadmin_can_delete_group_chat_message_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"Chat Group {unique}")

    msg = client.post(f"/api/groups/{group['id']}/chat", json={"message": "spam"}, headers=alice["auth"]).json()
    res = client.delete(f"/api/groups/{group['id']}/chat/{msg['id']}", headers=god["auth"])
    assert res.status_code == 200, res.text

    remaining = client.get(f"/api/groups/{group['id']}/chat?after_id=0", headers=alice["auth"]).json()
    assert not any(m["id"] == msg["id"] for m in remaining)


def test_superadmin_can_delete_global_chat_message(client, unique):
    alice = register(client, f"a_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])

    msg = client.post("/api/chat/global", json={"message": "global spam"}, headers=alice["auth"]).json()
    res = client.delete(f"/api/chat/global/{msg['id']}", headers=god["auth"])
    assert res.status_code == 200, res.text


def test_superadmin_cannot_stake_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"Stake Block Group {unique}")
    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q?", "options": ["Yes", "No"]}, headers=alice["auth"],
    ).json()

    res = client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 10}, headers=god["auth"])
    assert res.status_code == 403


def test_superadmin_cannot_request_topup_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"Topup Block Group {unique}")

    res = client.post(f"/api/groups/{group['id']}/topup-requests", json={"amount": 10}, headers=god["auth"])
    assert res.status_code == 403


def test_superadmin_cannot_leave_group_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"Leave Block Group {unique}")

    res = client.post(f"/api/groups/{group['id']}/leave", headers=god["auth"])
    assert res.status_code == 403


def test_superadmin_cannot_start_or_cast_vote_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"Vote Block Group {unique}")
    join_group(client, bob, group["invite_code"])

    res = client.post(
        f"/api/groups/{group['id']}/votes",
        json={"type": "change_leader", "target_user_id": bob["id"]},
        headers=god["auth"],
    )
    assert res.status_code == 403

    # A real vote started by an actual member should also be uncastable by the superadmin.
    vote = client.post(
        f"/api/groups/{group['id']}/votes",
        json={"type": "change_leader", "target_user_id": bob["id"]},
        headers=alice["auth"],
    ).json()
    res = client.post(f"/api/votes/{vote['id']}/ballot", json={"choice": "yes"}, headers=god["auth"])
    assert res.status_code == 403


def test_superadmin_can_delete_bet_without_joining(client, unique):
    alice = register(client, f"a_{unique}")
    god = register(client, f"g_{unique}")
    make_superadmin(god["id"])
    group = create_group(client, alice, f"Delete Bet Group {unique}")
    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q?", "options": ["Yes", "No"]}, headers=alice["auth"],
    ).json()

    res = client.delete(f"/api/bets/{bet['id']}", headers=god["auth"])
    assert res.status_code == 200, res.text
