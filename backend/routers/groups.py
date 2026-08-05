import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import get_group_or_404, get_membership_or_403, log_event, require_leader
from backend.models import Bet, BetHiddenFrom, Group, GroupEvent, Membership, Stake, TopUpRequest, Transaction, User
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


def _hidden_bet_ids_for(db: Session, user_id: int):
    """Incognito questions: bet ids this user must not see anywhere --
    lists, live event notifications, none of it."""
    return {h.bet_id for h in db.query(BetHiddenFrom).filter(BetHiddenFrom.user_id == user_id).all()}


def _hidden_from_names(db: Session, bet_id: int):
    rows = db.query(BetHiddenFrom).filter(BetHiddenFrom.bet_id == bet_id).all()
    return [db.get(User, r.user_id).display_name for r in rows]


def _remove_member(db: Session, group_id: int, membership: Membership):
    """Shared by leave/kick: refund any stakes the person has on still-open
    bets (otherwise a resolution later would try to pay out to a membership
    row that no longer exists), auto-reject their pending top-up requests
    for the same reason, then drop their membership."""
    user_id = membership.user_id
    open_stakes = (
        db.query(Stake)
        .join(Bet, Stake.bet_id == Bet.id)
        .filter(Stake.user_id == user_id, Bet.group_id == group_id, Bet.status == "open")
        .all()
    )
    for s in open_stakes:
        membership.balance += s.amount
        db.add(
            Transaction(
                group_id=group_id, user_id=user_id, type="refund", amount=s.amount,
                balance_after=membership.balance, ref_bet_id=s.bet_id,
            )
        )
        db.delete(s)

    pending = (
        db.query(TopUpRequest)
        .filter(TopUpRequest.group_id == group_id, TopUpRequest.user_id == user_id, TopUpRequest.status == "pending")
        .all()
    )
    for req in pending:
        req.status = "rejected"
        req.resolved_at = datetime.datetime.utcnow()

    db.delete(membership)


@router.post("", response_model=GroupSummary)
def create_group(body: GroupCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if body.parent_group_id is not None:
        get_group_or_404(db, body.parent_group_id)
        get_membership_or_403(db, body.parent_group_id, user.id)

    group = Group(name=body.name, leader_id=user.id, parent_group_id=body.parent_group_id)
    db.add(group)
    db.flush()
    membership = Membership(user_id=user.id, group_id=group.id, balance=0)
    db.add(membership)
    if body.parent_group_id is not None:
        log_event(
            db, body.parent_group_id, user.id, "subgroup_created",
            f'{user.display_name} created a sub-group: "{body.name}"',
        )
    db.commit()
    db.refresh(group)
    return GroupSummary(
        id=group.id, name=group.name, invite_code=group.invite_code, leader_id=group.leader_id,
        is_member=True, my_balance=0,
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
        is_member=True,
        my_balance=existing.balance,
    )


@router.post("/{group_id}/join", response_model=GroupSummary)
def join_subgroup(group_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Frictionless join for sub-groups only: no invite code needed since
    you're already a trusted member of the parent. Top-level groups still
    require the invite-code flow above."""
    group = get_group_or_404(db, group_id)
    if group.parent_group_id is None:
        raise HTTPException(status_code=403, detail="Top-level groups require an invite code to join")
    get_membership_or_403(db, group.parent_group_id, user.id)

    existing = db.query(Membership).filter(Membership.group_id == group_id, Membership.user_id == user.id).first()
    if existing is None:
        existing = Membership(user_id=user.id, group_id=group_id, balance=0)
        db.add(existing)
        db.commit()

    return GroupSummary(
        id=group.id, name=group.name, invite_code=group.invite_code, leader_id=group.leader_id,
        is_member=True, my_balance=existing.balance,
    )


@router.get("", response_model=list[GroupSummary])
def list_my_groups(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    memberships = db.query(Membership).filter(Membership.user_id == user.id).all()
    result = []
    for m in memberships:
        group = m.group
        parent_name = db.get(Group, group.parent_group_id).name if group.parent_group_id else None
        result.append(
            GroupSummary(
                id=group.id, name=group.name, invite_code=group.invite_code, leader_id=group.leader_id,
                is_member=True, my_balance=m.balance, parent_group_name=parent_name,
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

    hidden_bet_ids = _hidden_bet_ids_for(db, user.id)
    bets = []
    for bet in db.query(Bet).filter(Bet.group_id == group_id).order_by(Bet.created_at.desc()).all():
        if bet.id in hidden_bet_ids:
            continue
        bets.append(
            BetSummary(
                id=bet.id, question=bet.question, options=bet.options, status=bet.status,
                winning_option=bet.winning_option, creator_id=bet.creator_id,
                option_totals=_option_totals(db, bet), closes_at=bet.closes_at,
                hidden_from_names=_hidden_from_names(db, bet.id), image_data=bet.image_data,
                created_at=bet.created_at,
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

    subgroups = []
    for sg in db.query(Group).filter(Group.parent_group_id == group_id).order_by(Group.created_at.asc()).all():
        sg_membership = (
            db.query(Membership).filter(Membership.group_id == sg.id, Membership.user_id == user.id).first()
        )
        subgroups.append(
            GroupSummary(
                id=sg.id, name=sg.name, invite_code=sg.invite_code, leader_id=sg.leader_id,
                is_member=sg_membership is not None, my_balance=sg_membership.balance if sg_membership else 0,
            )
        )

    parent_group_name = None
    invitable_members = []
    if group.parent_group_id is not None:
        parent = db.get(Group, group.parent_group_id)
        parent_group_name = parent.name if parent else None
        member_ids = {m.user_id for m in db.query(Membership).filter(Membership.group_id == group_id).all()}
        parent_members = db.query(Membership).filter(Membership.group_id == group.parent_group_id).all()
        for pm in parent_members:
            if pm.user_id not in member_ids:
                invitable_members.append(
                    MemberBalance(
                        user_id=pm.user_id, display_name=pm.user.display_name, username=pm.user.username,
                        balance=pm.balance,
                    )
                )

    return GroupDetail(
        id=group.id, name=group.name, invite_code=group.invite_code, leader_id=group.leader_id,
        my_balance=my_membership.balance, parent_group_id=group.parent_group_id,
        parent_group_name=parent_group_name, subgroups=subgroups, invitable_members=invitable_members,
        members=members, bets=bets, pending_topups=pending_topups,
        latest_event_id=latest_event_id,
    )


@router.post("/{group_id}/leave", response_model=dict)
def leave_group(group_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    group = get_group_or_404(db, group_id)
    membership = get_membership_or_403(db, group_id, user.id, for_update=True)

    if group.leader_id == user.id:
        raise HTTPException(
            status_code=400,
            detail="Leaders can't leave -- start a vote to change leader first (Members section)",
        )

    log_event(db, group_id, user.id, "member_left", f"{user.display_name} left the group")
    _remove_member(db, group_id, membership)
    db.commit()
    return {"ok": True}


@router.post("/{group_id}/kick/{user_id}", response_model=dict)
def kick_member(
    group_id: int, user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    group = get_group_or_404(db, group_id)
    require_leader(group, user.id)

    if user_id == user.id:
        raise HTTPException(status_code=400, detail="You can't kick yourself -- use leave instead")

    membership = get_membership_or_403(db, group_id, user_id, for_update=True)
    kicked = db.get(User, user_id)
    log_event(db, group_id, user.id, "member_kicked", f"{user.display_name} removed {kicked.display_name} from the group")
    _remove_member(db, group_id, membership)
    db.commit()
    return {"ok": True}


@router.post("/{group_id}/invite/{user_id}", response_model=dict)
def invite_to_subgroup(
    group_id: int, user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """Push-based counterpart to /join: any current sub-group member can
    directly add another parent-group member, rather than relying on that
    person discovering and self-joining."""
    group = get_group_or_404(db, group_id)
    if group.parent_group_id is None:
        raise HTTPException(status_code=403, detail="Only sub-groups support direct invites")
    get_membership_or_403(db, group_id, user.id)
    get_membership_or_403(db, group.parent_group_id, user_id)

    existing = db.query(Membership).filter(Membership.group_id == group_id, Membership.user_id == user_id).first()
    if existing is not None:
        raise HTTPException(status_code=400, detail="That person is already in this sub-group")

    invitee = db.get(User, user_id)
    db.add(Membership(user_id=user_id, group_id=group_id, balance=0))
    log_event(db, group_id, user.id, "member_invited", f"{user.display_name} invited {invitee.display_name} to join")
    db.commit()
    return {"ok": True}


@router.get("/{group_id}/events", response_model=list[EventOut])
def list_events(
    group_id: int, after_id: int = 0, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)

    hidden_bet_ids = _hidden_bet_ids_for(db, user.id)
    events = (
        db.query(GroupEvent)
        .filter(GroupEvent.group_id == group_id, GroupEvent.id > after_id)
        .order_by(GroupEvent.id.asc())
        .limit(50)
        .all()
    )
    out = []
    for e in events:
        if e.ref_bet_id is not None and e.ref_bet_id in hidden_bet_ids:
            continue
        actor = db.get(User, e.actor_id)
        out.append(
            EventOut(
                id=e.id, type=e.type, actor_id=e.actor_id, actor_name=actor.display_name, message=e.message,
                ref_bet_id=e.ref_bet_id, created_at=e.created_at,
            )
        )
    return out
