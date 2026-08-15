from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.models import PushSubscription, User
from backend.push import PUSH_ENABLED, VAPID_PUBLIC_KEY, send_push
from backend.schemas import PushSubscribeRequest, PushUnsubscribeRequest, VapidKeyOut

router = APIRouter(prefix="/api/push", tags=["push"])


@router.get("/vapid-public-key", response_model=VapidKeyOut)
def get_vapid_public_key():
    return VapidKeyOut(public_key=VAPID_PUBLIC_KEY, enabled=PUSH_ENABLED)


@router.post("/subscribe", response_model=dict)
def subscribe(body: PushSubscribeRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == body.endpoint).first()
    if existing is not None:
        # Same browser subscribing again (e.g. after logging in as someone
        # else on a shared device) -- repoint it rather than erroring on
        # the unique constraint.
        existing.user_id = user.id
        existing.p256dh_key = body.keys.p256dh
        existing.auth_key = body.keys.auth
    else:
        db.add(PushSubscription(
            user_id=user.id, endpoint=body.endpoint, p256dh_key=body.keys.p256dh, auth_key=body.keys.auth,
        ))
    db.commit()
    return {"ok": True}


@router.post("/unsubscribe", response_model=dict)
def unsubscribe(body: PushUnsubscribeRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(PushSubscription).filter(
        PushSubscription.endpoint == body.endpoint, PushSubscription.user_id == user.id
    ).delete()
    db.commit()
    return {"ok": True}


def notify_user(db: Session, user_id: int, title: str, body: str, url: str = "/"):
    """Push to every device the user has subscribed on. Deliberately never
    raises -- called from the middle of other endpoints (resolving a bet,
    approving a top-up), and a notification failing to send must never fail
    the action that triggered it."""
    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    for sub in subs:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh_key, "auth": sub.auth_key},
        }
        result = send_push(subscription_info, title, body, url)
        if result == "expired":
            db.delete(sub)
    db.commit()
