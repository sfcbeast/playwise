from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.models import Bet, Group, GroupEvent, Membership


def get_group_or_404(db: Session, group_id: int) -> Group:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


def get_membership_or_403(db: Session, group_id: int, user_id: int) -> Membership:
    membership = (
        db.query(Membership)
        .filter(Membership.group_id == group_id, Membership.user_id == user_id)
        .first()
    )
    if membership is None:
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    return membership


def require_leader(group: Group, user_id: int):
    if group.leader_id != user_id:
        raise HTTPException(status_code=403, detail="Only the group leader can do this")


def require_creator_or_leader(bet: Bet, group: Group, user_id: int):
    if user_id != bet.creator_id and user_id != group.leader_id:
        raise HTTPException(
            status_code=403, detail="Only the question's creator or the group leader can do this"
        )


def log_event(
    db: Session, group_id: int, actor_id: int, type_: str, message: str, ref_bet_id: Optional[int] = None
):
    db.add(GroupEvent(group_id=group_id, actor_id=actor_id, type=type_, message=message, ref_bet_id=ref_bet_id))
