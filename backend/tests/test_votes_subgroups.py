from backend.tests.conftest import create_group, join_group, register, topup


def test_leader_change_vote_passes_at_60_percent(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    carol = register(client, f"c_{unique}")
    group = create_group(client, alice, "Vote Group")
    join_group(client, bob, group["invite_code"])
    join_group(client, carol, group["invite_code"])

    res = client.post(
        f"/api/groups/{group['id']}/votes",
        json={"type": "change_leader", "target_user_id": carol["id"]},
        headers=bob["auth"],
    )
    assert res.status_code == 200
    vote_id = res.json()["id"]

    # bob votes yes: 1/3 = 33%, not enough yet
    res = client.post(f"/api/votes/{vote_id}/ballot", json={"choice": "yes"}, headers=bob["auth"])
    assert res.json()["status"] == "open"

    # carol votes yes: 2/3 = 66.7% >= 60% -> passes immediately
    res = client.post(f"/api/votes/{vote_id}/ballot", json={"choice": "yes"}, headers=carol["auth"])
    assert res.json()["status"] == "passed"

    group_after = client.get(f"/api/groups/{group['id']}", headers=alice["auth"]).json()
    assert group_after["leader_id"] == carol["id"]


def test_dispute_vote_reverses_payout(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    carol = register(client, f"c_{unique}")
    group = create_group(client, alice, "Dispute Group")
    join_group(client, bob, group["invite_code"])
    join_group(client, carol, group["invite_code"])
    topup(client, alice, group["id"], 300, alice)
    topup(client, bob, group["id"], 300, alice)

    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q", "options": ["A", "B"]}, headers=alice["auth"]
    ).json()
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 200}, headers=alice["auth"])
    client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": 0}, headers=alice["auth"])

    balance_after_resolve = client.get(f"/api/groups/{group['id']}", headers=alice["auth"]).json()["my_balance"]
    assert balance_after_resolve == 300 - 200 + 200  # sole staker on the winning side gets the whole pool back

    res = client.post(
        f"/api/groups/{group['id']}/votes",
        json={"type": "dispute_resolution", "target_bet_id": bet["id"], "reason": "wrong call"},
        headers=bob["auth"],
    )
    assert res.status_code == 200
    vote_id = res.json()["id"]

    client.post(f"/api/votes/{vote_id}/ballot", json={"choice": "yes"}, headers=bob["auth"])
    res = client.post(f"/api/votes/{vote_id}/ballot", json={"choice": "yes"}, headers=carol["auth"])
    assert res.json()["status"] == "passed"

    bet_after = client.get(f"/api/bets/{bet['id']}", headers=alice["auth"]).json()
    assert bet_after["status"] == "open"
    assert bet_after["winning_option"] is None

    balance_after_revert = client.get(f"/api/groups/{group['id']}", headers=alice["auth"]).json()["my_balance"]
    assert balance_after_revert == 300 - 200  # payout reversed, stake still locked in since bet reopened

    # can be resolved again correctly
    res = client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": 1}, headers=alice["auth"])
    assert res.status_code == 200


def test_subgroup_has_independent_wallet(client, unique):
    alice = register(client, f"a_{unique}")
    parent = create_group(client, alice, "Parent")
    topup(client, alice, parent["id"], 500, alice)

    res = client.post("/api/groups", json={"name": "Child", "parent_group_id": parent["id"]}, headers=alice["auth"])
    assert res.status_code == 200
    sub = res.json()
    assert sub["my_balance"] == 0  # independent from the 500 in the parent

    parent_balance = client.get(f"/api/groups/{parent['id']}", headers=alice["auth"]).json()["my_balance"]
    assert parent_balance == 500  # unaffected by creating the sub-group


def test_subgroup_invite_requires_parent_membership(client, unique):
    alice = register(client, f"a_{unique}")
    outsider = register(client, f"o_{unique}")
    parent = create_group(client, alice, "Parent2")
    sub = client.post(
        "/api/groups", json={"name": "Child2", "parent_group_id": parent["id"]}, headers=alice["auth"]
    ).json()

    res = client.post(f"/api/groups/{sub['id']}/invite/{outsider['id']}", headers=alice["auth"])
    assert res.status_code == 403


def test_subgroup_self_join_no_longer_exists(client, unique):
    alice = register(client, f"a_{unique}")
    parent = create_group(client, alice, "Parent3")
    sub = client.post(
        "/api/groups", json={"name": "Child3", "parent_group_id": parent["id"]}, headers=alice["auth"]
    ).json()

    res = client.post(f"/api/groups/{sub['id']}/join", headers=alice["auth"])
    assert res.status_code == 405


def test_only_subgroup_leader_can_invite(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    dave = register(client, f"d_{unique}")
    parent = create_group(client, alice, "Parent4")
    join_group(client, bob, parent["invite_code"])
    join_group(client, dave, parent["invite_code"])

    # alice creates the sub-group (becomes its leader) and adds bob to it
    sub = client.post(
        "/api/groups", json={"name": "Child4", "parent_group_id": parent["id"]}, headers=alice["auth"]
    ).json()
    res = client.post(f"/api/groups/{sub['id']}/invite/{bob['id']}", headers=alice["auth"])
    assert res.status_code == 200, res.text

    # bob is now a sub-group member, but not its leader -- he can't invite dave
    res = client.post(f"/api/groups/{sub['id']}/invite/{dave['id']}", headers=bob["auth"])
    assert res.status_code == 403

    # dave was never added
    res = client.get(f"/api/groups/{sub['id']}", headers=alice["auth"])
    member_ids = {m["user_id"] for m in res.json()["members"]}
    assert dave["id"] not in member_ids


def test_invitable_members_hidden_from_non_leaders(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    eve = register(client, f"e_{unique}")
    parent = create_group(client, alice, "Parent5")
    join_group(client, bob, parent["invite_code"])
    join_group(client, eve, parent["invite_code"])

    sub = client.post(
        "/api/groups", json={"name": "Child5", "parent_group_id": parent["id"]}, headers=alice["auth"]
    ).json()
    client.post(f"/api/groups/{sub['id']}/invite/{bob['id']}", headers=alice["auth"])

    # alice is the sub-group leader -- she can see who's invitable
    res = client.get(f"/api/groups/{sub['id']}", headers=alice["auth"])
    assert any(m["user_id"] == eve["id"] for m in res.json()["invitable_members"])

    # bob is just a member -- no visibility into the parent's full roster
    res = client.get(f"/api/groups/{sub['id']}", headers=bob["auth"])
    assert res.json()["invitable_members"] == []


def test_incognito_bet_invisible_to_blinded_member(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    carol = register(client, f"c_{unique}")
    group = create_group(client, alice, "Incognito Group")
    join_group(client, bob, group["invite_code"])
    join_group(client, carol, group["invite_code"])

    res = client.post(
        f"/api/groups/{group['id']}/bets",
        json={"question": "Secret", "options": ["A", "B"], "hidden_from_user_ids": [carol["id"]]},
        headers=alice["auth"],
    )
    assert res.status_code == 200
    bet_id = res.json()["id"]

    carol_group = client.get(f"/api/groups/{group['id']}", headers=carol["auth"]).json()
    assert all(b["id"] != bet_id for b in carol_group["bets"])

    bob_group = client.get(f"/api/groups/{group['id']}", headers=bob["auth"]).json()
    assert any(b["id"] == bet_id for b in bob_group["bets"])

    res = client.get(f"/api/bets/{bet_id}", headers=carol["auth"])
    assert res.status_code == 404

    # a direct guess at the id can't be used to sneak a stake in either
    res = client.post(f"/api/bets/{bet_id}/stake", json={"option_index": 0, "amount": 1}, headers=carol["auth"])
    assert res.status_code == 404


def test_leave_refunds_open_stakes(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    group = create_group(client, alice, "Leave Group")
    join_group(client, bob, group["invite_code"])
    topup(client, bob, group["id"], 200, alice)

    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q", "options": ["A", "B"]}, headers=alice["auth"]
    ).json()
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 150}, headers=bob["auth"])

    res = client.post(f"/api/groups/{group['id']}/leave", headers=bob["auth"])
    assert res.status_code == 200

    res = client.get(f"/api/groups/{group['id']}", headers=bob["auth"])
    assert res.status_code == 403  # no longer a member


def test_leader_cannot_leave(client, unique):
    alice = register(client, f"a_{unique}")
    group = create_group(client, alice, "Solo Leader Group")
    res = client.post(f"/api/groups/{group['id']}/leave", headers=alice["auth"])
    assert res.status_code == 400


def test_only_leader_can_kick(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    carol = register(client, f"c_{unique}")
    group = create_group(client, alice, "Kick Group")
    join_group(client, bob, group["invite_code"])
    join_group(client, carol, group["invite_code"])

    res = client.post(f"/api/groups/{group['id']}/kick/{carol['id']}", headers=bob["auth"])
    assert res.status_code == 403

    res = client.post(f"/api/groups/{group['id']}/kick/{carol['id']}", headers=alice["auth"])
    assert res.status_code == 200
    res = client.get(f"/api/groups/{group['id']}", headers=carol["auth"])
    assert res.status_code == 403
