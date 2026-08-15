from .conftest import register


def create_public_group(client, user, name, category="general", rules=None):
    res = client.post(
        "/api/groups",
        json={"name": name, "is_public": True, "category": category, "rules": rules},
        headers=user["auth"],
    )
    assert res.status_code == 200, res.text
    return res.json()


def test_private_groups_dont_appear_in_discover(client, unique):
    alice = register(client, f"a_{unique}")
    client.post("/api/groups", json={"name": f"Private {unique}"}, headers=alice["auth"])

    res = client.get("/api/groups/discover", headers=alice["auth"])
    assert res.status_code == 200
    names = [g["name"] for g in res.json()]
    assert f"Private {unique}" not in names


def test_public_group_appears_and_searchable(client, unique):
    alice = register(client, f"a_{unique}")
    create_public_group(client, alice, f"Sports Fans {unique}", category="sports")

    res = client.get("/api/groups/discover", headers=alice["auth"])
    names = [g["name"] for g in res.json()]
    assert f"Sports Fans {unique}" in names

    res = client.get(f"/api/groups/discover?q=Sports Fans {unique}", headers=alice["auth"])
    assert len(res.json()) == 1
    assert res.json()[0]["category"] == "sports"

    res = client.get("/api/groups/discover?q=nonexistentxyz", headers=alice["auth"])
    assert res.json() == []


def test_discover_category_filter(client, unique):
    alice = register(client, f"a_{unique}")
    create_public_group(client, alice, f"Stocks Group {unique}", category="stocks")
    create_public_group(client, alice, f"Politics Group {unique}", category="politics")

    res = client.get("/api/groups/discover?category=stocks", headers=alice["auth"])
    names = [g["name"] for g in res.json()]
    assert f"Stocks Group {unique}" in names
    assert f"Politics Group {unique}" not in names


def test_invalid_category_rejected(client, unique):
    alice = register(client, f"a_{unique}")
    res = client.post(
        "/api/groups",
        json={"name": f"Bad {unique}", "is_public": True, "category": "not_a_real_category"},
        headers=alice["auth"],
    )
    assert res.status_code == 400


def test_join_public_group_without_rules(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    group = create_public_group(client, alice, f"No Rules {unique}")

    res = client.post(f"/api/groups/{group['id']}/join-public", json={}, headers=bob["auth"])
    assert res.status_code == 200, res.text
    assert res.json()["is_member"] is True

    res = client.get(f"/api/groups/{group['id']}", headers=bob["auth"])
    member_ids = {m["user_id"] for m in res.json()["members"]}
    assert bob["id"] in member_ids


def test_join_public_group_with_rules_requires_acceptance(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    group = create_public_group(client, alice, f"Rules Group {unique}", rules="Be nice. No spam.")

    res = client.post(f"/api/groups/{group['id']}/join-public", json={"accepted_rules": False}, headers=bob["auth"])
    assert res.status_code == 400

    res = client.post(f"/api/groups/{group['id']}/join-public", json={"accepted_rules": True}, headers=bob["auth"])
    assert res.status_code == 200, res.text


def test_join_public_fails_for_private_group(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    group = client.post("/api/groups", json={"name": f"Priv {unique}"}, headers=alice["auth"]).json()

    res = client.post(f"/api/groups/{group['id']}/join-public", json={}, headers=bob["auth"])
    assert res.status_code == 403


def test_group_settings_leader_only(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    group = client.post("/api/groups", json={"name": f"Toggle {unique}"}, headers=alice["auth"]).json()

    res = client.patch(
        f"/api/groups/{group['id']}/settings",
        json={"is_public": True, "category": "general", "rules": "Play nice"},
        headers=bob["auth"],
    )
    assert res.status_code == 403

    res = client.patch(
        f"/api/groups/{group['id']}/settings",
        json={"is_public": True, "category": "general", "rules": "Play nice"},
        headers=alice["auth"],
    )
    assert res.status_code == 200, res.text

    res = client.get("/api/groups/discover", headers=bob["auth"])
    names = [g["name"] for g in res.json()]
    assert f"Toggle {unique}" in names


def test_settings_going_private_clears_public_visibility(client, unique):
    alice = register(client, f"a_{unique}")
    group = create_public_group(client, alice, f"Flip {unique}")

    res = client.patch(
        f"/api/groups/{group['id']}/settings", json={"is_public": False}, headers=alice["auth"]
    )
    assert res.status_code == 200

    res = client.get("/api/groups/discover", headers=alice["auth"])
    names = [g["name"] for g in res.json()]
    assert f"Flip {unique}" not in names
