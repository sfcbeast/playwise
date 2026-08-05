from .conftest import create_group, register

TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="


def test_create_bet_with_image(client, unique):
    user = register(client, f"{unique}a")
    group = create_group(client, user, f"grp-{unique}")

    res = client.post(
        f"/api/groups/{group['id']}/bets",
        json={"question": "Q?", "options": ["A", "B"], "image_data": TINY_PNG},
        headers=user["auth"],
    )
    assert res.status_code == 200, res.text
    bet = res.json()
    assert bet["image_data"] == TINY_PNG

    res = client.get(f"/api/bets/{bet['id']}", headers=user["auth"])
    assert res.json()["image_data"] == TINY_PNG


def test_create_bet_without_image_has_none(client, unique):
    user = register(client, f"{unique}b")
    group = create_group(client, user, f"grp2-{unique}")
    res = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q?", "options": ["A", "B"]}, headers=user["auth"]
    )
    assert res.json()["image_data"] is None


def test_reject_non_data_url_image(client, unique):
    user = register(client, f"{unique}c")
    group = create_group(client, user, f"grp3-{unique}")
    res = client.post(
        f"/api/groups/{group['id']}/bets",
        json={"question": "Q?", "options": ["A", "B"], "image_data": "https://evil.example.com/x.png"},
        headers=user["auth"],
    )
    assert res.status_code == 400


def test_reject_oversized_image(client, unique):
    user = register(client, f"{unique}d")
    group = create_group(client, user, f"grp4-{unique}")
    huge = "data:image/png;base64," + ("A" * 3_000_000)
    res = client.post(
        f"/api/groups/{group['id']}/bets",
        json={"question": "Q?", "options": ["A", "B"], "image_data": huge},
        headers=user["auth"],
    )
    assert res.status_code == 422


def test_edit_bet_can_replace_and_remove_image(client, unique):
    user = register(client, f"{unique}e")
    group = create_group(client, user, f"grp5-{unique}")
    res = client.post(
        f"/api/groups/{group['id']}/bets",
        json={"question": "Q?", "options": ["A", "B"], "image_data": TINY_PNG},
        headers=user["auth"],
    )
    bet_id = res.json()["id"]

    # Edit without touching the image keeps it.
    res = client.patch(
        f"/api/bets/{bet_id}", json={"question": "Q2?", "options": ["A", "B"]}, headers=user["auth"]
    )
    assert res.json()["image_data"] == TINY_PNG

    # remove_image clears it even if image_data is also sent.
    res = client.patch(
        f"/api/bets/{bet_id}",
        json={"question": "Q2?", "options": ["A", "B"], "remove_image": True},
        headers=user["auth"],
    )
    assert res.status_code == 200, res.text
    assert res.json()["image_data"] is None


def test_group_listing_includes_bet_image(client, unique):
    user = register(client, f"{unique}f")
    group = create_group(client, user, f"grp6-{unique}")
    client.post(
        f"/api/groups/{group['id']}/bets",
        json={"question": "Q?", "options": ["A", "B"], "image_data": TINY_PNG},
        headers=user["auth"],
    )
    res = client.get(f"/api/groups/{group['id']}", headers=user["auth"])
    bets = res.json()["bets"]
    assert bets[0]["image_data"] == TINY_PNG
