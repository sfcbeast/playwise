import logging
import os
import traceback

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.db import sync_schema
from backend.routers import auth_router, bets, chat, groups, push, reports, votes, wallet

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("playwise")

sync_schema()

app = FastAPI(title="Playwise")

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
app.mount("/", NoCacheStaticFiles(directory=frontend_dir, html=True), name="frontend")
