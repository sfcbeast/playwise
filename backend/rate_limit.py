import threading
import time
from collections import defaultdict

from fastapi import HTTPException, Request

# Single in-memory limiter is fine here: Render runs this app as one process
# (WEB_CONCURRENCY=1), so there's no second worker with its own copy of
# state to get out of sync with. If that ever changes, this needs to move
# to something shared (e.g. Redis) instead.
_lock = threading.Lock()
_attempts: dict[str, list] = defaultdict(list)


def _client_ip(request: Request) -> str:
    # Render sits behind a proxy (Cloudflare), so request.client.host is the
    # proxy's address, not the visitor's -- prefer the forwarded header.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(request: Request, key_prefix: str, max_attempts: int, window_seconds: int):
    key = f"{key_prefix}:{_client_ip(request)}"
    now = time.time()
    cutoff = now - window_seconds
    with _lock:
        attempts = _attempts[key]
        while attempts and attempts[0] < cutoff:
            attempts.pop(0)
        if len(attempts) >= max_attempts:
            raise HTTPException(status_code=429, detail="Too many attempts. Please wait a bit and try again.")
        attempts.append(now)
