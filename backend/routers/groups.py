from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import get_group_or_404, get_membership_or_403
from backend.models import Bet, Group, GroupEvent, Membership, Stake, TopUpRequest, User
from backend.schemas import (
    BetSummary,
    EventOut,
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
                option_totals=_option_totals(db, bet), closes_at=bet.closes_at, created_at=bet.created_at,
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

    latest_event_id = (
        db.query(func.max(GroupEvent.id)).filter(GroupEvent.group_id == group_id).scalar() or 0
    )

    return GroupDetail(
        id=group.id, name=group.name, invite_code=group.invite_code, leader_id=group.leader_id,
        my_balance=my_membership.balance, members=members, bets=bets, pending_topups=pending_topups,
        latest_event_id=latest_event_id,
    )


@router.get("/{group_id}/events", response_model=list[EventOut])
def list_events(
    group_id: int, after_id: int = 0, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)

    events = (
        db.query(GroupEvent)
        .filter(GroupEvent.group_id == group_id, GroupEvent.id > after_id)
        .order_by(GroupEvent.id.asc())
        .limit(50)
        .all()
    )
    out = []
    for e in events:
        actor = db.get(User, e.actor_id)
        out.append(
            EventOut(
                id=e.id, type=e.type, actor_id=e.actor_id, actor_name=actor.display_name, message=e.message,
                ref_bet_id=e.ref_bet_id, created_at=e.created_at,
            )
        )
    return out
