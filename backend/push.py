import json
import logging
import os

from pywebpush import WebPushException, webpush

logger = logging.getLogger("playwise")

# Real keys belong in env vars for a real deployment; without them push is
# silently disabled (send_push becomes a no-op) rather than the app failing
# to start -- same "degrade, don't crash" spirit as the rest of this app's
# optional-infra pieces (no ad network, no email service).
VAPID_PRIVATE_KEY_PEM = os.environ.get("VAPID_PRIVATE_KEY_PEM")
VAPID_PUBLIC_KEY = os.environ.get(
    "VAPID_PUBLIC_KEY", "BKUGX63egJkyx9EoLcdHvmyyCJycmJzpA57Tn-g12xrITO3KMgi6PjFuZD31npLXeUMG7lQ628drxnHcL-H6of4"
)
VAPID_CONTACT_EMAIL = os.environ.get("VAPID_CONTACT_EMAIL", "suryavamsid15@gmail.com")

PUSH_ENABLED = bool(VAPID_PRIVATE_KEY_PEM)


def send_push(subscription_info: dict, title: str, body: str, url: str = "/") -> str:
    """Sends one push message. Returns 'sent', 'expired' (subscription is
    dead and the caller should delete it), or 'failed' (transient -- leave
    the subscription alone, might work next time). Never raises: a push
    delivery failure must never take down whatever action triggered it
    (resolving a bet, approving a top-up, etc.)."""
    if not PUSH_ENABLED:
        return "failed"
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=VAPID_PRIVATE_KEY_PEM,
            vapid_claims={"sub": f"mailto:{VAPID_CONTACT_EMAIL}"},
        )
        return "sent"
    except WebPushException as e:
        status = e.response.status_code if e.response is not None else None
        if status in (404, 410):
            return "expired"
        logger.error("Push send failed (status=%s): %s", status, e)
        return "failed"
    except Exception:
        logger.error("Push send raised unexpectedly", exc_info=True)
        return "failed"
