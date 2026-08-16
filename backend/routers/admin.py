import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import require_admin
from backend.models import ChatMessage, Group, Membership, Report, User
from backend.schemas import AdminGroupOut, AdminStatsOut, AdminUserOut

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsOut)
def get_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_admin(user)
    week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    return AdminStatsOut(
        total_users=db.query(User).count(),
        new_users_7d=db.query(User).filter(User.created_at >= week_ago).count(),
        total_groups=db.query(Group).count(),
        public_groups=db.query(Group).filter(Group.is_public.is_(True)).count(),
        total_chat_messages=db.query(ChatMessage).count(),
        open_reports=db.query(Report).filter(Report.status == "open").count(),
    )


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    limit: int = 50, offset: int = 0, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    require_admin(user)
    limit = max(1, min(limit, 200))
    users = db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    out = []
    for u in users:
        group_count = db.query(Membership).filter(Membership.user_id == u.id).count()
        out.append(
            AdminUserOut(
                id=u.id, username=u.username, display_name=u.display_name, is_admin=u.is_admin,
                created_at=u.created_at, group_count=group_count,
            )
        )
    return out


@router.get("/groups", response_model=list[AdminGroupOut])
def list_groups(
    limit: int = 50, offset: int = 0, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    require_admin(user)
    limit = max(1, min(limit, 200))
    groups = db.query(Group).order_by(Group.created_at.desc()).offset(offset).limit(limit).all()
    out = []
    for g in groups:
        leader = db.get(User, g.leader_id)
        member_count = db.query(Membership).filter(Membership.group_id == g.id).count()
        out.append(
            AdminGroupOut(
                id=g.id, name=g.name, leader_display_name=leader.display_name if leader else "[deleted]",
                member_count=member_count, is_public=g.is_public, category=g.category, created_at=g.created_at,
            )
        )
    return out
