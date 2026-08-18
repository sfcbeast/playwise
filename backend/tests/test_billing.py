from backend.db import SessionLocal
from backend.models import Subscription, User

from .conftest import register


def test_new_user_is_not_premium_by_default(client, unique):
    alice = register(client, f"a_{unique}")
    res = client.post("/api/login", json={"username": f"a_{unique}", "password": "password123"})
    assert res.status_code == 200
    assert res.json()["is_premium"] is False


def test_premium_flag_reflected_on_fresh_login(client, unique):
    alice = register(client, f"a_{unique}")

    db = SessionLocal()
    try:
        user = db.get(User, alice["id"])
        user.is_premium = True
        db.add(Subscription(
            user_id=user.id, stripe_customer_id="cus_test", stripe_subscription_id="sub_test",
            plan="monthly", status="active",
        ))
        db.commit()
    finally:
        db.close()

    res = client.post("/api/login", json={"username": f"a_{unique}", "password": "password123"})
    assert res.status_code == 200
    assert res.json()["is_premium"] is True
