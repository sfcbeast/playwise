from .conftest import register


def test_vapid_public_key_is_public(client):
    res = client.get("/api/push/vapid-public-key")
    assert res.status_code == 200
    assert res.json()["public_key"]
    # No VAPID_PRIVATE_KEY_PEM env var in the test environment -- push is
    # correctly reported as disabled rather than pretending to work.
    assert res.json()["enabled"] is False


def test_subscribe_requires_auth(client):
    res = client.post(
        "/api/push/subscribe",
        json={"endpoint": "https://example.com/push/abc", "keys": {"p256dh": "x", "auth": "y"}},
    )
    assert res.status_code == 401


def test_subscribe_and_unsubscribe(client, unique):
    alice = register(client, f"a_{unique}")
    endpoint = f"https://example.com/push/{unique}"

    res = client.post(
        "/api/push/subscribe",
        json={"endpoint": endpoint, "keys": {"p256dh": "p256dh-value", "auth": "auth-value"}},
        headers=alice["auth"],
    )
    assert res.status_code == 200, res.text

    # Subscribing again with the same endpoint (e.g. re-registering) doesn't error.
    res = client.post(
        "/api/push/subscribe",
        json={"endpoint": endpoint, "keys": {"p256dh": "new-value", "auth": "auth-value"}},
        headers=alice["auth"],
    )
    assert res.status_code == 200, res.text

    res = client.post("/api/push/unsubscribe", json={"endpoint": endpoint}, headers=alice["auth"])
    assert res.status_code == 200, res.text


def test_resolving_a_bet_does_not_fail_when_push_delivery_fails(client, unique):
    """Push is disabled in tests (no VAPID key), but a winner still has a
    subscription row on file -- resolve_bet must not blow up trying (and
    failing) to actually deliver to it."""
    alice = register(client, f"a_{unique}")
    from .conftest import create_group, topup

    group = create_group(client, alice, f"PushGrp {unique}")
    topup(client, alice, group["id"], 500, alice)

    client.post(
        "/api/push/subscribe",
        json={"endpoint": f"https://example.com/push/{unique}", "keys": {"p256dh": "a", "auth": "b"}},
        headers=alice["auth"],
    )

    bet = client.post(
        f"/api/groups/{group['id']}/bets", json={"question": "Q?", "options": ["A", "B"]}, headers=alice["auth"]
    ).json()
    client.post(f"/api/bets/{bet['id']}/stake", json={"option_index": 0, "amount": 100}, headers=alice["auth"])

    res = client.post(f"/api/bets/{bet['id']}/resolve", json={"winning_option": 0}, headers=alice["auth"])
    assert res.status_code == 200, res.text
