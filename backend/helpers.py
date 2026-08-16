from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.models import Bet, Group, GroupEvent, Membership, User


def get_group_or_404(db: Session, group_id: int) -> Group:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


def get_membership_or_403(
    db: Session, group_id: int, user_id: int, for_update: bool = False, allow_superadmin: bool = True
) -> Membership:
    """for_update=True takes a row lock (SELECT ... FOR UPDATE on Postgres;
    a harmless no-op on SQLite, which has no row-level locking) so a
    concurrent request touching the same balance has to wait rather than
    racing -- use it on every path that reads a balance and then writes it
    back (stakes, top-ups, payouts, votes), not on read-only lookups.

    allow_superadmin=True (the default) lets a superadmin through even
    without a real Membership row, via a synthetic zero-balance,
    never-persisted stand-in -- fine for viewing/management paths, but
    pass allow_superadmin=False on anything that reads or writes an
    actual balance (staking, top-up requests, leaving), since a superadmin
    who hasn't joined has no real balance to act with."""
    query = db.query(Membership).filter(Membership.group_id == group_id, Membership.user_id == user_id)
    if for_update:
        query = query.with_for_update()
    membership = query.first()
    if membership is not None:
        return membership
    if allow_superadmin:
        requester = db.get(User, user_id)
        if requester is not None and requester.is_superadmin:
            return Membership(user_id=user_id, group_id=group_id, balance=0)
    raise HTTPException(status_code=403, detail="You are not a member of this group")


def require_leader(group: Group, user: User):
    if group.leader_id != user.id and not user.is_superadmin:
        raise HTTPException(status_code=403, detail="Only the group leader can do this")


def require_creator_or_leader(bet: Bet, group: Group, user: User):
    if user.id != bet.creator_id and user.id != group.leader_id and not user.is_superadmin:
        raise HTTPException(
            status_code=403, detail="Only the question's creator or the group leader can do this"
        )


def require_admin(user: User):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admins only")


def log_event(
    db: Session, group_id: int, actor_id: int, type_: str, message: str, ref_bet_id: Optional[int] = None
):
    db.add(GroupEvent(group_id=group_id, actor_id=actor_id, type=type_, message=message, ref_bet_id=ref_bet_id))
