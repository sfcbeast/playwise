import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import get_group_or_404, get_membership_or_403, log_event, require_leader
from backend.models import Membership, TopUpRequest, Transaction, User
from backend.routers.push import notify_user
from backend.schemas import TopUpCreateRequest, TopUpRequestOut, TransactionOut

router = APIRouter(prefix="/api/groups/{group_id}", tags=["wallet"])


@router.post("/topup-requests", response_model=TopUpRequestOut)
def request_topup(
    group_id: int, body: TopUpCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    group = get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)

    req = TopUpRequest(group_id=group_id, user_id=user.id, amount=body.amount)
    db.add(req)
    db.flush()
    log_event(
        db, group_id, user.id, "topup_requested",
        f"{user.display_name} requested a top-up of {body.amount} coins",
    )
    db.commit()
    db.refresh(req)
    if group.leader_id != user.id:
        notify_user(
            db, group.leader_id, "Top-up request", f"{user.display_name} wants {body.amount} coins in {group.name}",
            url=f"/#/groups/{group_id}",
        )
    return TopUpRequestOut(
        id=req.id, group_id=req.group_id, user_id=req.user_id, display_name=user.display_name,
        amount=req.amount, status=req.status, created_at=req.created_at,
    )


@router.get("/topup-requests", response_model=list[TopUpRequestOut])
def list_topup_requests(group_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)

    out = []
    for req in (
        db.query(TopUpRequest).filter(TopUpRequest.group_id == group_id).order_by(TopUpRequest.created_at.desc()).all()
    ):
        requester = db.get(User, req.user_id)
        out.append(
            TopUpRequestOut(
                id=req.id, group_id=req.group_id, user_id=req.user_id, display_name=requester.display_name,
                amount=req.amount, status=req.status, created_at=req.created_at,
            )
        )
    return out


@router.post("/topup-requests/{request_id}/approve", response_model=TopUpRequestOut)
def approve_topup(
    group_id: int, request_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    group = get_group_or_404(db, group_id)
    require_leader(group, user.id)

    req = db.get(TopUpRequest, request_id, with_for_update=True)
    if req is None or req.group_id != group_id:
        raise HTTPException(status_code=404, detail="Top-up request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already resolved")

    membership = get_membership_or_403(db, group_id, req.user_id, for_update=True)
    membership.balance += req.amount
    req.status = "approved"
    req.resolved_at = datetime.datetime.utcnow()
    req.resolved_by = user.id

    db.add(
        Transaction(
            group_id=group_id, user_id=req.user_id, type="topup", amount=req.amount,
            balance_after=membership.balance, ref_request_id=req.id,
        )
    )
    requester = db.get(User, req.user_id)
    log_event(
        db, group_id, user.id, "topup_approved",
        f"{user.display_name} approved {requester.display_name}'s top-up of {req.amount} coins",
    )
    db.commit()
    db.refresh(req)
    if req.user_id != user.id:
        notify_user(
            db, req.user_id, "Top-up approved", f"+{req.amount} coins in {group.name}",
            url=f"/#/groups/{group_id}",
        )
    return TopUpRequestOut(
        id=req.id, group_id=req.group_id, user_id=req.user_id, display_name=requester.display_name,
        amount=req.amount, status=req.status, created_at=req.created_at,
    )


@router.post("/topup-requests/{request_id}/reject", response_model=TopUpRequestOut)
def reject_topup(
    group_id: int, request_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    group = get_group_or_404(db, group_id)
    require_leader(group, user.id)

    req = db.get(TopUpRequest, request_id, with_for_update=True)
    if req is None or req.group_id != group_id:
        raise HTTPException(status_code=404, detail="Top-up request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already resolved")

    req.status = "rejected"
    req.resolved_at = datetime.datetime.utcnow()
    req.resolved_by = user.id
    requester = db.get(User, req.user_id)
    log_event(
        db, group_id, user.id, "topup_rejected",
        f"{user.display_name} rejected {requester.display_name}'s top-up request of {req.amount} coins",
    )
    db.commit()
    db.refresh(req)
    return TopUpRequestOut(
        id=req.id, group_id=req.group_id, user_id=req.user_id, display_name=requester.display_name,
        amount=req.amount, status=req.status, created_at=req.created_at,
    )


@router.get("/transactions", response_model=list[TransactionOut])
def list_transactions(group_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)

    txns = (
        db.query(Transaction)
        .filter(Transaction.group_id == group_id, Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .all()
    )
    return [
        TransactionOut(
            id=t.id, type=t.type, amount=t.amount, balance_after=t.balance_after,
            ref_bet_id=t.ref_bet_id, ref_request_id=t.ref_request_id, created_at=t.created_at,
        )
        for t in txns
    ]
