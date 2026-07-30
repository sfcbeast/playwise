import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import get_group_or_404, get_membership_or_403, require_leader
from backend.models import Membership, TopUpRequest, Transaction, User
from backend.schemas import TopUpCreateRequest, TopUpRequestOut, TransactionOut

router = APIRouter(prefix="/api/groups/{group_id}", tags=["wallet"])


@router.post("/topup-requests", response_model=TopUpRequestOut)
def request_topup(
    group_id: int, body: TopUpCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)

    req = TopUpRequest(group_id=group_id, user_id=user.id, amount=body.amount)
    db.add(req)
    db.commit()
    db.refresh(req)
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

    req = db.get(TopUpRequest, request_id)
    if req is None or req.group_id != group_id:
        raise HTTPException(status_code=404, detail="Top-up request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already resolved")

    membership = (
        db.query(Membership).filter(Membership.group_id == group_id, Membership.user_id == req.user_id).first()
    )
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
    db.commit()
    db.refresh(req)
    requester = db.get(User, req.user_id)
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

    req = db.get(TopUpRequest, request_id)
    if req is None or req.group_id != group_id:
        raise HTTPException(status_code=404, detail="Top-up request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already resolved")

    req.status = "rejected"
    req.resolved_at = datetime.datetime.utcnow()
    req.resolved_by = user.id
    db.commit()
    db.refresh(req)
    requester = db.get(User, req.user_id)
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
