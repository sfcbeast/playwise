from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import get_group_or_404, get_membership_or_403
from backend.models import Bet, Group, Membership, Stake, TopUpRequest, User
from backend.schemas import (
    BetSummary,
    GroupCreateRequest,
    GroupDetail,
    GroupJoinRequest,
    GroupSummary,
    MemberBalance,
    TopUpRequestOut,
)

router = APIRouter(prefix="/api/groups", tags=["groups"])


def _option_totals(db: Session, bet: Bet):
    totals = [0] * len(bet.options)
    for stake in db.query(Stake).filter(Stake.bet_id == bet.id).all():
        totals[stake.option_index] += stake.amount
    return totals


@router.post("", response_model=GroupSummary)
def create_group(body: GroupCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    group = Group(name=body.name, leader_id=user.id)
    db.add(group)
    db.flush()
    membership = Membership(user_id=user.id, group_id=group.id, balance=0)
    db.add(membership)
    db.commit()
    db.refresh(group)
    return GroupSummary(
        id=group.id, name=group.name, invite_code=group.invite_code, leader_id=group.leader_id, my_balance=0
    )


@router.post("/join", response_model=GroupSummary)
def join_group(body: GroupJoinRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    group = db.query(Group).filter(Group.invite_code == body.invite_code).first()
    if group is None:
        raise HTTPException(status_code=404, detail="No group found with that invite code")

    existing = (
        db.query(Membership).filter(Membership.group_id == group.id, Membership.user_id == user.id).first()
    )
    if existing is None:
        existing = Membership(user_id=user.id, group_id=group.id, balance=0)
        db.add(existing)
        db.commit()

    return GroupSummary(
        id=group.id,
        name=group.name,
        invite_code=group.invite_code,
        leader_id=group.leader_id,
        my_balance=existing.balance,
    )


@router.get("", response_model=list[GroupSummary])
def list_my_groups(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    memberships = db.query(Membership).filter(Membership.user_id == user.id).all()
    result = []
    for m in memberships:
        group = m.group
        result.append(
            GroupSummary(
                id=group.id, name=group.name, invite_code=group.invite_code, leader_id=group.leader_id,
                my_balance=m.balance,
            )
        )
    return result


@router.get("/{group_id}", response_model=GroupDetail)
def get_group(group_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    group = get_group_or_404(db, group_id)
    my_membership = get_membership_or_403(db, group_id, user.id)

    members = []
    for m in db.query(Membership).filter(Membership.group_id == group_id).all():
        members.append(
            MemberBalance(
                user_id=m.user_id, display_name=m.user.display_name, username=m.user.username, balance=m.balance
            )
        )

    bets = []
    for bet in db.query(Bet).filter(Bet.group_id == group_id).order_by(Bet.created_at.desc()).all():
        bets.append(
            BetSummary(
                id=bet.id, question=bet.question, options=bet.options, status=bet.status,
                winning_option=bet.winning_option, creator_id=bet.creator_id,
                option_totals=_option_totals(db, bet), created_at=bet.created_at,
            )
        )

    pending_topups = []
    for req in (
        db.query(TopUpRequest)
        .filter(TopUpRequest.group_id == group_id, TopUpRequest.status == "pending")
        .order_by(TopUpRequest.created_at.asc())
        .all()
    ):
        requester = db.get(User, req.user_id)
        pending_topups.append(
            TopUpRequestOut(
                id=req.id, group_id=req.group_id, user_id=req.user_id, display_name=requester.display_name,
                amount=req.amount, status=req.status, created_at=req.created_at,
            )
        )

    return GroupDetail(
        id=group.id, name=group.name, invite_code=group.invite_code, leader_id=group.leader_id,
        my_balance=my_membership.balance, members=members, bets=bets, pending_topups=pending_topups,
    )
