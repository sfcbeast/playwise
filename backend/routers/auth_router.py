import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.auth import create_access_token, get_current_user, hash_password, verify_password
from backend.db import get_db
from backend.models import User, gen_recovery_code
from backend.rate_limit import rate_limit
from backend.schemas import LoginRequest, RecoveryCodeOut, RegisterRequest, ResetPasswordRequest, TokenResponse

router = APIRouter(tags=["auth"])


@router.post("/api/register", response_model=TokenResponse)
def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "register", max_attempts=8, window_seconds=3600)
    if not body.accepted_terms:
        raise HTTPException(
            status_code=400, detail="You must acknowledge that Playwise coins are play money before creating an account"
        )
    recovery_code = gen_recovery_code()
    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
        terms_accepted_at=datetime.datetime.utcnow(),
        recovery_code_hash=hash_password(recovery_code),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username already taken")
    db.refresh(user)
    token = create_access_token(user.id, user.token_version)
    return TokenResponse(
        access_token=token, user_id=user.id, username=user.username, display_name=user.display_name,
        is_admin=user.is_admin, recovery_code=recovery_code,
    )


@router.post("/api/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    rate_limit(request, "login", max_attempts=15, window_seconds=300)
    user = db.query(User).filter(User.username == body.username).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    token = create_access_token(user.id, user.token_version)
    return TokenResponse(
        access_token=token, user_id=user.id, username=user.username, display_name=user.display_name,
        is_admin=user.is_admin,
    )


@router.post("/api/reset-password", response_model=TokenResponse)
def reset_password(body: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    # Deliberately stricter than login -- a recovery code is a bearer secret
    # that grants a password change, so brute-forcing it is more valuable to
    # an attacker than guessing a password (which just gets rate-limited the
    # same way anyway).
    rate_limit(request, "reset-password", max_attempts=5, window_seconds=3600)
    user = db.query(User).filter(User.username == body.username).first()
    if (
        user is None
        or not user.recovery_code_hash
        or not verify_password(body.recovery_code, user.recovery_code_hash)
    ):
        raise HTTPException(status_code=400, detail="Invalid username or recovery code")

    # Single-use: rotate to a fresh code so the old one (now potentially
    # seen in transit/logs/shoulder-surfed during recovery) can't be reused.
    new_recovery_code = gen_recovery_code()
    user.password_hash = hash_password(body.new_password)
    user.recovery_code_hash = hash_password(new_recovery_code)
    # Resetting your password is exactly the moment any previously-issued
    # token (including a possibly-leaked one that's the reason you're
    # resetting in the first place) should stop working.
    user.token_version += 1
    db.commit()
    token = create_access_token(user.id, user.token_version)
    return TokenResponse(
        access_token=token, user_id=user.id, username=user.username, display_name=user.display_name,
        is_admin=user.is_admin, recovery_code=new_recovery_code,
    )


@router.post("/api/account/recovery-code", response_model=RecoveryCodeOut)
def regenerate_recovery_code(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Self-service for anyone who registered before this existed, lost
    their code, or just wants a fresh one -- generates and returns a brand
    new code (invalidating any previous one), shown exactly once."""
    code = gen_recovery_code()
    user.recovery_code_hash = hash_password(code)
    db.commit()
    return RecoveryCodeOut(recovery_code=code)


@router.post("/api/account/logout-everywhere", response_model=dict)
def logout_everywhere(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Invalidates every token issued for this account, including the one
    used to call this endpoint -- the caller needs to log back in
    immediately afterward, same as every other device/tab that was signed
    in. For "I think someone else has access to my account," not routine use."""
    user.token_version += 1
    db.commit()
    return {"ok": True}
