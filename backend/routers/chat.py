from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import get_group_or_404, get_membership_or_403
from backend.models import ChatMessage, Group, User
from backend.rate_limit import check_rate_limit
from backend.schemas import ChatMessageCreateRequest, ChatMessageOut

router = APIRouter(tags=["chat"])

MAX_MESSAGES_PER_MINUTE = 20


def _to_out(db: Session, m: ChatMessage) -> ChatMessageOut:
    author = db.get(User, m.user_id)
    return ChatMessageOut(id=m.id, user_id=m.user_id, display_name=author.display_name, message=m.message, created_at=m.created_at)


def _post_message(db: Session, group_id, user: User, body: ChatMessageCreateRequest) -> ChatMessageOut:
    check_rate_limit(f"chat:{user.id}", MAX_MESSAGES_PER_MINUTE, 60)
    msg = ChatMessage(group_id=group_id, user_id=user.id, message=body.message)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _to_out(db, msg)


def _list_messages(db: Session, group_id, after_id: int):
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.group_id == group_id, ChatMessage.id > after_id)
        .order_by(ChatMessage.id.asc())
        .limit(100)
        .all()
    )
    return [_to_out(db, m) for m in msgs]


def _delete_message(db: Session, message: ChatMessage, user: User, group: Optional[Group]):
    is_own = message.user_id == user.id
    is_group_leader = group is not None and group.leader_id == user.id
    if not is_own and not is_group_leader:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")
    db.delete(message)
    db.commit()


@router.post("/api/chat/global", response_model=ChatMessageOut)
def post_global_message(
    body: ChatMessageCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return _post_message(db, None, user, body)


@router.get("/api/chat/global", response_model=list[ChatMessageOut])
def list_global_messages(after_id: int = 0, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _list_messages(db, None, after_id)


@router.delete("/api/chat/global/{message_id}", response_model=dict)
def delete_global_message(message_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    msg = db.get(ChatMessage, message_id)
    if msg is None or msg.group_id is not None:
        raise HTTPException(status_code=404, detail="Message not found")
    _delete_message(db, msg, user, None)
    return {"ok": True}


@router.post("/api/groups/{group_id}/chat", response_model=ChatMessageOut)
def post_group_message(
    group_id: int, body: ChatMessageCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)
    return _post_message(db, group_id, user, body)


@router.get("/api/groups/{group_id}/chat", response_model=list[ChatMessageOut])
def list_group_messages(
    group_id: int, after_id: int = 0, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)
    return _list_messages(db, group_id, after_id)


@router.delete("/api/groups/{group_id}/chat/{message_id}", response_model=dict)
def delete_group_message(
    group_id: int, message_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    group = get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)
    msg = db.get(ChatMessage, message_id)
    if msg is None or msg.group_id != group_id:
        raise HTTPException(status_code=404, detail="Message not found")
    _delete_message(db, msg, user, group)
    return {"ok": True}
