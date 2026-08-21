from backend.rate_limit import _attempts

from .conftest import create_group, join_group, register


def test_global_chat_post_and_list(client, unique):
    a = register(client, f"{unique}a")
    b = register(client, f"{unique}b")

    res = client.post("/api/chat/global", json={"message": "hello everyone"}, headers=a["auth"])
    assert res.status_code == 200, res.text
    msg = res.json()
    assert msg["message"] == "hello everyone"
    assert msg["user_id"] == a["id"]

    res = client.get("/api/chat/global?after_id=0", headers=b["auth"])
    assert res.status_code == 200
    assert any(m["id"] == msg["id"] for m in res.json())

    res = client.get(f"/api/chat/global?after_id={msg['id']}", headers=b["auth"])
    assert res.json() == []


def test_global_chat_blocks_profanity_and_slurs(client, unique):
    a = register(client, f"{unique}a")
    # Deliberately not testing with an actual slur -- this proves the same
    # code path (the filter doesn't distinguish severity) without putting
    # one in the codebase. The production wordlist covers slurs too.
    res = client.post("/api/chat/global", json={"message": "what the fuck"}, headers=a["auth"])
    assert res.status_code == 400
    assert "isn't allowed" in res.json()["detail"]

    res = client.get("/api/chat/global?after_id=0", headers=a["auth"])
    assert not any(m["message"] == "what the fuck" for m in res.json())  # never stored


def test_global_chat_requires_auth(client):
    res = client.get("/api/chat/global")
    assert res.status_code == 401


def test_group_chat_blocks_profanity_too(client, unique):
    leader = register(client, f"{unique}gp")
    group = create_group(client, leader, f"profanity-grp-{unique}")

    res = client.post(f"/api/groups/{group['id']}/chat", json={"message": "shit happens"}, headers=leader["auth"])
    assert res.status_code == 400
    assert "isn't allowed" in res.json()["detail"]


def test_group_chat_members_only(client, unique):
    leader = register(client, f"{unique}l")
    outsider = register(client, f"{unique}o")
    group = create_group(client, leader, f"grp-{unique}")

    res = client.post(f"/api/groups/{group['id']}/chat", json={"message": "hi group"}, headers=leader["auth"])
    assert res.status_code == 200, res.text

    res = client.get(f"/api/groups/{group['id']}/chat?after_id=0", headers=outsider["auth"])
    assert res.status_code == 403

    res = client.post(f"/api/groups/{group['id']}/chat", json={"message": "sneaking in"}, headers=outsider["auth"])
    assert res.status_code == 403


def test_group_chat_isolated_from_global(client, unique):
    leader = register(client, f"{unique}l2")
    group = create_group(client, leader, f"grp2-{unique}")

    client.post(f"/api/groups/{group['id']}/chat", json={"message": "group only"}, headers=leader["auth"])
    client.post("/api/chat/global", json={"message": "global only"}, headers=leader["auth"])

    group_msgs = client.get(f"/api/groups/{group['id']}/chat?after_id=0", headers=leader["auth"]).json()
    global_msgs = client.get("/api/chat/global?after_id=0", headers=leader["auth"]).json()

    assert any(m["message"] == "group only" for m in group_msgs)
    assert not any(m["message"] == "global only" for m in group_msgs)
    assert any(m["message"] == "global only" for m in global_msgs)
    assert not any(m["message"] == "group only" for m in global_msgs)


def test_delete_own_message(client, unique):
    a = register(client, f"{unique}da")
    res = client.post("/api/chat/global", json={"message": "delete me"}, headers=a["auth"])
    msg_id = res.json()["id"]

    res = client.delete(f"/api/chat/global/{msg_id}", headers=a["auth"])
    assert res.status_code == 200

    remaining = client.get("/api/chat/global?after_id=0", headers=a["auth"]).json()
    assert not any(m["id"] == msg_id for m in remaining)


def test_delete_others_message_forbidden_unless_leader(client, unique):
    leader = register(client, f"{unique}ml")
    member = register(client, f"{unique}mm")
    group = create_group(client, leader, f"grp3-{unique}")
    join_group(client, member, group["invite_code"])

    res = client.post(f"/api/groups/{group['id']}/chat", json={"message": "member text"}, headers=member["auth"])
    msg_id = res.json()["id"]

    # A random other member can't delete someone else's message.
    other = register(client, f"{unique}mo")
    join_group(client, other, group["invite_code"])
    res = client.delete(f"/api/groups/{group['id']}/chat/{msg_id}", headers=other["auth"])
    assert res.status_code == 403

    # The group leader can moderate-delete it even though they didn't write it.
    res = client.delete(f"/api/groups/{group['id']}/chat/{msg_id}", headers=leader["auth"])
    assert res.status_code == 200


def test_global_chat_delete_ignores_group_leadership(client, unique):
    leader = register(client, f"{unique}gl")
    member = register(client, f"{unique}gm")
    create_group(client, leader, f"grp4-{unique}")

    res = client.post("/api/chat/global", json={"message": "global msg"}, headers=member["auth"])
    msg_id = res.json()["id"]

    # Being a leader of some unrelated group doesn't grant global-chat moderation.
    res = client.delete(f"/api/chat/global/{msg_id}", headers=leader["auth"])
    assert res.status_code == 403


def test_chat_rate_limit(client, unique):
    user = register(client, f"{unique}rl")
    _attempts.clear()
    for i in range(20):
        res = client.post("/api/chat/global", json={"message": f"msg {i}"}, headers=user["auth"])
        assert res.status_code == 200, res.text
    res = client.post("/api/chat/global", json={"message": "one too many"}, headers=user["auth"])
    assert res.status_code == 429
    _attempts.clear()
