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

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
