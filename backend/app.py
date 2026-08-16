import logging
import os
import secrets
import traceback

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.db import sync_schema
from backend.routers import auth_router, bets, chat, groups, push, reports, votes, wallet

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("playwise")

sync_schema()

app = FastAPI(title="Playwise")


# AdSense's ad-serving scripts load from a rotating set of Google/ad-tech
# domains that changes over time, so a domain allowlist for script-src would
# be both fragile and (per Google's own CSP guidance) explicitly discouraged.
# Instead: a fresh random nonce per request, applied to every <script> tag we
# render (see the "/" route below) plus 'strict-dynamic', which extends trust
# to whatever a nonce'd script loads in turn -- that's what lets AdSense's own
# script pull in its dependents without us maintaining a domain list.
# 'unsafe-inline'/'unsafe-eval'/https:/http: are same-line fallbacks for
# browsers too old to understand 'strict-dynamic' or nonces; any modern
# browser that honors 'strict-dynamic' ignores those fallback tokens entirely,
# so this isn't actually a regression for anyone running a current browser.
# Ad creatives can be served from effectively any ad-exchange/advertiser
# domain, which is why img-src/frame-src/connect-src/style-src are opened to
# https: -- that's inherent to how programmatic ad serving works, not
# something a domain list could narrow down either.
def _build_csp(nonce: str) -> str:
    return (
        "default-src 'self'; "
        f"script-src 'nonce-{nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:; "
        "style-src 'self' 'unsafe-inline' https:; "
        "img-src 'self' data: blob: https:; "
        "font-src 'self' https:; "
        "connect-src 'self' https:; "
        "frame-src https:; "
        "manifest-src 'self'; "
        "object-src 'none'; "
        "base-uri 'none'; "
        "frame-ancestors 'none'"
    )


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    nonce = secrets.token_urlsafe(16)
    request.state.csp_nonce = nonce
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = _build_csp(nonce)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Render terminates TLS in front of this app and the production domain
    # is HTTPS-only, so it's safe to always tell browsers to remember that --
    # this header is simply ignored over a plain HTTP connection (e.g. local
    # dev), so it can't break anything there.
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


app.include_router(auth_router.router)
app.include_router(groups.router)
app.include_router(wallet.router)
app.include_router(bets.router)
app.include_router(votes.router)
app.include_router(chat.router)
app.include_router(reports.router)
app.include_router(push.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # There's no Sentry/error-tracking service wired up (needs its own
    # account), so this is the practical substitute: every unhandled crash
    # gets one clearly-tagged, greppable log line with a full traceback,
    # instead of relying on someone noticing the app is broken. Search
    # Render's log viewer for "UNHANDLED EXCEPTION" to find these. The
    # client only ever gets a generic message -- never the raw traceback.
    logger.error(
        "UNHANDLED EXCEPTION on %s %s\n%s", request.method, request.url.path, traceback.format_exc()
    )
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on our end. Please try again."})


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    # 5xx from an explicit HTTPException(500, ...) is still a bug worth
    # seeing in the logs; 4xx are expected user-facing errors (bad
    # password, insufficient balance, etc.) and would just be noise.
    if exc.status_code >= 500:
        logger.error("HTTP %s on %s %s: %s", exc.status_code, request.method, request.url.path, exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Keep FastAPI's normal 422 behavior/shape, just route it through so the
    # two handlers above don't have to special-case it.
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


class NoCacheStaticFiles(StaticFiles):
    """This is a single-page app that only ever fetches app.js/index.html
    once per tab (hash-based routing never re-requests them), and the
    default static response has no Cache-Control header at all -- browsers
    then apply their own heuristic caching, which can silently keep serving
    an old app.js from a tab left open across a deploy. Forcing revalidation
    means a cheap 304 when unchanged, and an immediate fresh fetch when not."""

    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "no-cache"
        return response


frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

with open(os.path.join(frontend_dir, "index.html"), encoding="utf-8") as f:
    _INDEX_HTML_TEMPLATE = f.read()


def _serve_index(request: Request) -> HTMLResponse:
    # This is the one HTML page in the app, so it's the only place a nonce
    # ever needs to land -- every <script> tag in index.html carries the
    # __CSP_NONCE__ placeholder, replaced here with the same random value the
    # middleware above put in this request's CSP header.
    nonce = request.state.csp_nonce
    html = _INDEX_HTML_TEMPLATE.replace("__CSP_NONCE__", nonce)
    return HTMLResponse(html)


@app.get("/", include_in_schema=False)
async def index(request: Request):
    return _serve_index(request)


@app.get("/index.html", include_in_schema=False)
async def index_html(request: Request):
    return _serve_index(request)


app.mount("/", NoCacheStaticFiles(directory=frontend_dir, html=True), name="frontend")
