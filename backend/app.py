import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.db import Base, engine
from backend.routers import auth_router, bets, groups, wallet

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Prediction Pool")

app.include_router(auth_router.router)
app.include_router(groups.router)
app.include_router(wallet.router)
app.include_router(bets.router)

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
