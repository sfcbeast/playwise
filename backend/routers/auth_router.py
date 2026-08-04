from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.auth import create_access_token, hash_password, verify_password
from backend.db import get_db
from backend.models import User
from backend.rate_limit import rate_limit
from backend.schemas import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(tags=["auth"])


@router.post("/api/register", response_model=TokenResponse)
def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "register", max_attempts=8, window_seconds=3600)
    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username already taken")
    db.refresh(user)
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token, user_id=user.id, username=user.username, display_name=user.display_name
    )


@router.post("/api/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "login", max_attempts=15, window_seconds=300)
    user = db.query(User).filter(User.username == body.username).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token, user_id=user.id, username=user.username, display_name=user.display_name
    )
