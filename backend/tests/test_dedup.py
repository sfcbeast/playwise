from .conftest import create_group, register


def test_cannot_create_second_group_with_same_name(client, unique):
    alice = register(client, f"a_{unique}")
    create_group(client, alice, "Chels2026")

    res = client.post("/api/groups", json={"name": "chels2026"}, headers=alice["auth"])
    assert res.status_code == 400
    assert "already have a group named" in res.json()["detail"]


def test_can_create_group_with_same_name_as_someone_elses(client, unique):
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    create_group(client, alice, "Family")

    res = client.post("/api/groups", json={"name": "Family"}, headers=bob["auth"])
    assert res.status_code == 200, res.text


def test_can_join_a_group_that_name_collides_with_one_you_already_have(client, unique):
    # Blocking creation is about preventing accidental self-duplication --
    # joining via a real invite code someone sent you should never be
    # blocked just because the name happens to match.
    alice = register(client, f"a_{unique}")
    bob = register(client, f"b_{unique}")
    create_group(client, alice, "Poker Night")
    bobs_group = create_group(client, bob, "Poker Night")

    res = client.post("/api/groups/join", json={"invite_code": bobs_group["invite_code"]}, headers=alice["auth"])
    assert res.status_code == 200, res.text


def test_cannot_register_with_a_taken_display_name(client, unique):
    register(client, f"a_{unique}", display_name="Sam Reddy")

    res = client.post(
        "/api/register",
        json={
            "username": f"b_{unique}", "password": "password123", "display_name": "sam reddy",
            "accepted_terms": True,
        },
    )
    assert res.status_code == 400
    assert "already taken" in res.json()["detail"]


def test_different_display_names_register_fine(client, unique):
    register(client, f"a_{unique}", display_name=f"Sam Reddy {unique}")

    res = client.post(
        "/api/register",
        json={
            "username": f"b_{unique}", "password": "password123", "display_name": f"Sam Reddy Jr {unique}",
            "accepted_terms": True,
        },
    )
    assert res.status_code == 200, res.text
