import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import require_admin
from backend.models import ChatMessage, Group, Report, User
from backend.rate_limit import check_rate_limit
from backend.routers.push import notify_user
from backend.schemas import REPORT_TARGET_TYPES, ReportCreateRequest, ReportOut, ReportResolveRequest

router = APIRouter(tags=["reports"])


def _target_preview(db: Session, target_type: str, target_id: int) -> str:
    if target_type == "chat_message":
        msg = db.get(ChatMessage, target_id)
        if msg is None:
            return "[message no longer exists]"
        author = db.get(User, msg.user_id)
        snippet = msg.message if len(msg.message) <= 80 else msg.message[:77] + "..."
        return f'{author.display_name}: "{snippet}"'
    group = db.get(Group, target_id)
    if group is None:
        return "[group no longer exists]"
    return f'Group "{group.name}"' + ("" if group.is_public else " (now private)")


@router.post("/api/reports", response_model=dict)
def create_report(
    body: ReportCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    if body.target_type not in REPORT_TARGET_TYPES:
        raise HTTPException(status_code=400, detail=f"target_type must be one of: {', '.join(REPORT_TARGET_TYPES)}")

    # Reporting is cheap to abuse (it's just a DB row), so it gets its own
    # rate limit distinct from chat's -- someone flag-spamming shouldn't be
    # able to bury the admin queue.
    check_rate_limit(f"report:{user.id}", max_attempts=10, window_seconds=3600)

    if body.target_type == "chat_message" and db.get(ChatMessage, body.target_id) is None:
        raise HTTPException(status_code=404, detail="That message no longer exists")
    if body.target_type == "group" and db.get(Group, body.target_id) is None:
        raise HTTPException(status_code=404, detail="That group no longer exists")

    db.add(Report(reporter_id=user.id, target_type=body.target_type, target_id=body.target_id, reason=body.reason))
    db.commit()

    for admin in db.query(User).filter(User.is_admin.is_(True)).all():
        notify_user(db, admin.id, "New report to review", f"{user.display_name} flagged something", "/#/admin")

    return {"ok": True}


@router.get("/api/admin/reports", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_admin(user)
    reports = (
        db.query(Report).filter(Report.status == "open").order_by(Report.created_at.asc()).all()
    )
    out = []
    for r in reports:
        reporter = db.get(User, r.reporter_id)
        out.append(
            ReportOut(
                id=r.id, target_type=r.target_type, target_id=r.target_id,
                target_preview=_target_preview(db, r.target_type, r.target_id),
                reason=r.reason, reporter_display_name=reporter.display_name,
                status=r.status, created_at=r.created_at,
            )
        )
    return out


@router.post("/api/admin/reports/{report_id}/resolve", response_model=dict)
def resolve_report(
    report_id: int, body: ReportResolveRequest, db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_admin(user)
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "open":
        raise HTTPException(status_code=400, detail="Report is already resolved")

    if body.action == "delete_content" and report.target_type == "chat_message":
        msg = db.get(ChatMessage, report.target_id)
        if msg is not None:
            db.delete(msg)
    elif body.action == "unpublish_group" and report.target_type == "group":
        group = db.get(Group, report.target_id)
        if group is not None:
            group.is_public = False
            group.category = None
            group.rules = None
    elif body.action != "dismiss":
        raise HTTPException(status_code=400, detail="Invalid action for this report's target type")

    report.status = "resolved"
    report.resolved_at = datetime.datetime.utcnow()
    report.resolved_by = user.id
    db.commit()
    return {"ok": True}
