from backend.rate_limit import _attempts
from backend.tests.conftest import create_group, join_group, register, topup


def test_register_and_login(client, unique):
    user = register(client, f"alice_{unique}")
    res = client.post("/api/login", json={"username": f"alice_{unique}", "password": "password123"})
    assert res.status_code == 200
    assert res.json()["user_id"] == user["id"]


def test_duplicate_username_rejected(client, unique):
    register(client, f"dup_{unique}")
    res = client.post(
        "/api/register",
        json={"username": f"dup_{unique}", "password": "password123", "display_name": "Someone Else"},
    )
    assert res.status_code == 400


def test_wrong_password_rejected(client, unique):
    register(client, f"bob_{unique}")
    res = client.post("/api/login", json={"username": f"bob_{unique}", "password": "wrong"})
    assert res.status_code == 401


def test_register_requires_accepted_terms(client, unique):
    _attempts.clear()
    res = client.post(
        "/api/register",
        json={"username": f"noterms_{unique}", "password": "password123", "display_name": "No Terms"},
    )
    assert res.status_code == 400

    res = client.post(
        "/api/register",
        json={
            "username": f"noterms_{unique}", "password": "password123", "display_name": "No Terms",
            "accepted_terms": False,
        },
    )
    assert res.status_code == 400
    _attempts.clear()


def test_group_create_and_join(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    group = create_group(client, alice, "Test Group")
    assert group["leader_id"] == alice["id"]
    assert group["my_balance"] == 0

    joined = join_group(client, bob, group["invite_code"])
    assert joined["id"] == group["id"]

    res = client.get(f"/api/groups/{group['id']}", headers=bob["auth"])
    assert res.status_code == 200
    member_ids = {m["user_id"] for m in res.json()["members"]}
    assert {alice["id"], bob["id"]} == member_ids


def test_non_member_cannot_view_group(client, unique):
    alice = register(client, f"a_{unique}")
    outsider = register(client, f"o_{unique}")
    group = create_group(client, alice, "Private Group")
    res = client.get(f"/api/groups/{group['id']}", headers=outsider["auth"])
    assert res.status_code == 403


def test_topup_requires_leader_approval(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    group = create_group(client, alice, "Topup Group")
    join_group(client, bob, group["invite_code"])

    res = client.post(f"/api/groups/{group['id']}/topup-requests", json={"amount": 100}, headers=bob["auth"])
    req_id = res.json()["id"]

    # bob can't approve his own request
    res = client.post(f"/api/groups/{group['id']}/topup-requests/{req_id}/approve", headers=bob["auth"])
    assert res.status_code == 403

    res = client.post(f"/api/groups/{group['id']}/topup-requests/{req_id}/approve", headers=alice["auth"])
    assert res.status_code == 200
    assert res.json()["status"] == "approved"

    res = client.get(f"/api/groups/{group['id']}", headers=bob["auth"])
    assert res.json()["my_balance"] == 100


def test_pari_mutuel_payout_math(client, unique):
    """The core money guarantee: winners split the whole pool proportional
    to their stake, losers get nothing, balances are exact."""
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    carol = register(client, f"c_{unique}")
    group = create_group(client, alice, "Payout Group")
    join_group(client, bob, group["invite_code"])
    join_group(client, carol, group["invite_code"])
    topup(client, alice, group["id"], 500, alice)
    topup(client, bob, group["id"], 500, alice)
    topup(client, carol, group["id"], 500, alice)

    bet = client.post(
        f"/api/groups/{group['id']}/bets",
        json={"question": "Who wins?", "options": ["Yes", "No"]},
        headers=alice["auth"],
    ).json()

    # alice stakes 200 on Yes, bob stakes 100 on Yes, carol stakes 300 on No
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 200}, headers=alice["auth"])
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 100}, headers=bob["auth"])
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 1, "amount": 300}, headers=carol["auth"])

    res = client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": 0}, headers=alice["auth"])
    assert res.status_code == 200

    # total pool = 600, winning pool = 300 (200 alice + 100 bob)
    # alice: 200 * 600 // 300 = 400, bob: 100 * 600 // 300 = 200
    alice_balance = client.get(f"/api/groups/{group['id']}", headers=alice["auth"]).json()["my_balance"]
    bob_balance = client.get(f"/api/groups/{group['id']}", headers=bob["auth"]).json()["my_balance"]
    carol_balance = client.get(f"/api/groups/{group['id']}", headers=carol["auth"]).json()["my_balance"]

    assert alice_balance == 500 - 200 + 400  # 700
    assert bob_balance == 500 - 100 + 200  # 600
    assert carol_balance == 500 - 300  # 200, lost her stake
    assert alice_balance + bob_balance + carol_balance == 1500  # no coins created or destroyed


def test_refund_when_nobody_picks_winner(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    group = create_group(client, alice, "Refund Group")
    join_group(client, bob, group["invite_code"])
    topup(client, bob, group["id"], 300, alice)

    bet = client.post(
        f"/api/groups/{group['id']}/bets",
        json={"question": "Nobody picks this", "options": ["A", "B"]},
        headers=alice["auth"],
    ).json()
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 150}, headers=bob["auth"])

    # option B wins but nobody staked on it -> full refund
    client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": 1}, headers=alice["auth"])
    bob_balance = client.get(f"/api/groups/{group['id']}", headers=bob["auth"]).json()["my_balance"]
    assert bob_balance == 300  # got the 150 back


def test_cannot_stake_more_than_balance(client, unique):
    alice = register(client, f"a_{unique}")
    group = create_group(client, alice, "Overdraw Group")
    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q", "options": ["A", "B"]}, headers=alice["auth"]
    ).json()
    res = client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 50}, headers=alice["auth"])
    assert res.status_code == 400
    assert "balance" in res.json()["detail"].lower()


def test_only_creator_or_leader_can_resolve(client, unique):
    alice = register(client, f"a_{unique}")  # leader
    bob = register(client, f"b_{unique}")  # creator
    carol = register(client, f"c_{unique}")  # neither
    group = create_group(client, alice, "Resolve Perm Group")
    join_group(client, bob, group["invite_code"])
    join_group(client, carol, group["invite_code"])
    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q", "options": ["A", "B"]}, headers=bob["auth"]
    ).json()

    res = client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": 0}, headers=carol["auth"])
    assert res.status_code == 403

    res = client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": 0}, headers=bob["auth"])
    assert res.status_code == 200


def test_edit_blocked_once_stakes_exist(client, unique):
    alice = register(client, f"a_{unique}")
    topup_target = register(client, f"b_{unique}")
    group = create_group(client, alice, "Edit Group")
    join_group(client, topup_target, group["invite_code"])
    topup(client, topup_target, group["id"], 100, alice)
    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q", "options": ["A", "B"]}, headers=alice["auth"]
    ).json()

    res = client.patch(f"/api/bets/{bet['id']}", json={"question": "Edited", "options": ["A", "B"]}, headers=alice["auth"])
    assert res.status_code == 200

    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 10}, headers=topup_target["auth"])
    res = client.patch(f"/api/bets/{bet['id']}", json={"question": "Edited again", "options": ["A", "B"]}, headers=alice["auth"])
    assert res.status_code == 400


def test_rate_limit_login(client, unique):
    _attempts.clear()  # isolate from other tests' login calls sharing the same test-client IP
    register(client, f"rl_{unique}")
    statuses = []
    for _ in range(20):
        res = client.post("/api/login", json={"username": f"rl_{unique}", "password": "wrong"})
        statuses.append(res.status_code)
    assert 429 in statuses
    _attempts.clear()  # don't leave the limiter maxed out for whatever test runs next
