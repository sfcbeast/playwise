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


def test_active_stakes_shows_open_bets_across_groups_and_drops_on_resolve(client, unique):
    alice = register(client, f"a_{unique}")
    group_a = create_group(client, alice, f"Active Stakes A {unique}")
    group_b = create_group(client, alice, f"Active Stakes B {unique}")
    topup(client, alice, group_a["id"], 500, alice)
    topup(client, alice, group_b["id"], 500, alice)

    bet_a = client.post(
        f"/api/groups/{group_a['id']}/bets", json={"question": "In A", "options": ["Yes", "No"]},
        headers=alice["auth"],
    ).json()
    bet_b = client.post(
        f"/api/groups/{group_b['id']}/bets", json={"question": "In B", "options": ["Yes", "No"]},
        headers=alice["auth"],
    ).json()
    client.post(f"/api/bets/{bet_a['id']}/stake", json={"option_index": 0, "amount": 50}, headers=alice["auth"])
    client.post(f"/api/bets/{bet_b['id']}/stake", json={"option_index": 1, "amount": 75}, headers=alice["auth"])

    res = client.get("/api/me/active-stakes", headers=alice["auth"])
    assert res.status_code == 200
    by_bet = {row["bet_id"]: row for row in res.json()}
    assert by_bet[bet_a["id"]]["group_name"] == group_a["name"]
    assert by_bet[bet_a["id"]]["amount"] == 50
    assert by_bet[bet_a["id"]]["option_label"] == "Yes"
    assert by_bet[bet_b["id"]]["amount"] == 75

    # resolving a bet should drop it from "active" -- it's no longer open
    client.post(f"/api/bets/{bet_a['id']}/resolve", json={"winning_option": 0}, headers=alice["auth"])
    res = client.get("/api/me/active-stakes", headers=alice["auth"])
    remaining_ids = {row["bet_id"] for row in res.json()}
    assert bet_a["id"] not in remaining_ids
    assert bet_b["id"] in remaining_ids


def test_top_predictors_requires_minimum_resolved_bets(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    group = create_group(client, alice, f"Predictors Group {unique}")
    join_group(client, bob, group["invite_code"])
    topup(client, alice, group["id"], 1000, alice)
    topup(client, bob, group["id"], 1000, alice)

    # alice: 4 resolved bets, wins all 4 -- below the qualifying threshold
    for i in range(4):
        bet = client.post(
            f"/api/groups/{group['id']}/bets", json={"question": f"A{i}", "options": ["Yes", "No"]},
            headers=alice["auth"],
        ).json()
        client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 10}, headers=alice["auth"])
        client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": 0}, headers=alice["auth"])

    # bob: 5 resolved bets, wins 3 of them -- meets the threshold, 60% win rate
    for i in range(5):
        bet = client.post(
            f"/api/groups/{group['id']}/bets", json={"question": f"B{i}", "options": ["Yes", "No"]},
            headers=alice["auth"],
        ).json()
        winning = 0 if i < 3 else 1
        client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 10}, headers=bob["auth"])
        client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": winning}, headers=alice["auth"])

    res = client.get("/api/top-predictors", headers=alice["auth"])
    assert res.status_code == 200
    by_id = {row["user_id"]: row for row in res.json()}
    assert alice["id"] not in by_id  # only 4 resolved bets, below the threshold of 5
    assert by_id[bob["id"]]["win_pct"] == 60
    assert by_id[bob["id"]]["wins"] == 3
    assert by_id[bob["id"]]["resolved_bets"] == 5


def test_leaderboard_ranks_by_net_winnings_not_balance(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    carol = register(client, f"c_{unique}")
    group = create_group(client, alice, f"Leaderboard Group {unique}")
    join_group(client, bob, group["invite_code"])
    join_group(client, carol, group["invite_code"])
    # alice gets a much bigger top-up than bob -- a balance-based ranking
    # would put her first regardless of prediction skill.
    topup(client, alice, group["id"], 5000, alice)
    topup(client, bob, group["id"], 500, alice)
    topup(client, carol, group["id"], 500, alice)

    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q?", "options": ["Yes", "No"]}, headers=alice["auth"],
    ).json()
    # alice stakes big on the loser; bob stakes small on the winner
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 1, "amount": 300}, headers=alice["auth"])
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 50}, headers=bob["auth"])
    client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": 0}, headers=alice["auth"])

    board = client.get(f"/api/groups/{group['id']}/leaderboard", headers=alice["auth"]).json()
    by_id = {e["user_id"]: e for e in board}

    # total pool 350, winning pool 50 (just bob) -> payout = 50 * 350 // 50 = 350
    assert by_id[bob["id"]]["net_winnings"] == 300  # -50 stake + 350 payout
    assert by_id[alice["id"]]["net_winnings"] == -300  # lost her stake, no payout
    assert by_id[carol["id"]]["net_winnings"] == 0  # never staked

    # alice's balance (5000 topup - 300 stake = 4700) still dwarfs bob's
    # (500 + payout), proving balance and net_winnings really do diverge.
    assert by_id[alice["id"]]["balance"] > by_id[bob["id"]]["balance"]
    # but bob outranks alice on the leaderboard itself
    ranked_ids = [e["user_id"] for e in board]
    assert ranked_ids.index(bob["id"]) < ranked_ids.index(alice["id"])


def test_bet_summary_includes_staker_names_most_recent_first(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    group = create_group(client, alice, f"Staker Group {unique}")
    join_group(client, bob, group["invite_code"])
    topup(client, alice, group["id"], 500, alice)
    topup(client, bob, group["id"], 500, alice)

    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q?", "options": ["Yes", "No"]}, headers=alice["auth"],
    ).json()

    # no one's staked yet
    row = client.get(f"/api/groups/{group['id']}", headers=alice["auth"]).json()["bets"][0]
    assert row["staker_names"] == []
    assert row["staker_count"] == 0

    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 50}, headers=alice["auth"])
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 1, "amount": 50}, headers=bob["auth"])
    # alice stakes again -- shouldn't create a duplicate entry
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 25}, headers=alice["auth"])

    row = client.get(f"/api/groups/{group['id']}", headers=alice["auth"]).json()["bets"][0]
    assert row["staker_count"] == 2
    # alice's second stake is chronologically the most recent event, so she
    # sorts first after dedup even though bob staked in between her two.
    assert row["staker_names"][0] == alice["username"]
    assert set(row["staker_names"]) == {alice["username"], bob["username"]}


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
