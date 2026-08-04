import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.db import sync_schema
from backend.routers import auth_router, bets, groups, votes, wallet

sync_schema()

app = FastAPI(title="Playwise")

app.include_router(auth_router.router)
app.include_router(groups.router)
app.include_router(wallet.router)
app.include_router(bets.router)
app.include_router(votes.router)


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
