import datetime
import secrets

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from backend.db import Base


def utcnow():
    return datetime.datetime.utcnow()


def gen_invite_code():
    return secrets.token_hex(4)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    invite_code = Column(String, unique=True, nullable=False, default=gen_invite_code, index=True)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    leader = relationship("User")


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    balance = Column(Integer, nullable=False, default=0)
    joined_at = Column(DateTime, default=utcnow)

    user = relationship("User")
    group = relationship("Group")


class TopUpRequest(Base):
    __tablename__ = "topup_requests"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending/approved/rejected
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class Bet(Base):
    __tablename__ = "bets"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(String, nullable=False)
    options = Column(JSON, nullable=False)  # list[str]
    status = Column(String, nullable=False, default="open")  # open/resolved
    winning_option = Column(Integer, nullable=True)
    closes_at = Column(DateTime, nullable=True)  # optional staking deadline; resolution isn't gated by it
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class Stake(Base):
    __tablename__ = "stakes"

    id = Column(Integer, primary_key=True)
    bet_id = Column(Integer, ForeignKey("bets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    option_index = Column(Integer, nullable=False)
    amount = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=utcnow)


class GroupEvent(Base):
    __tablename__ = "group_events"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    ref_bet_id = Column(Integer, ForeignKey("bets.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # topup/stake/payout/refund
    amount = Column(Integer, nullable=False)  # signed: + credit, - debit
    balance_after = Column(Integer, nullable=False)
    ref_bet_id = Column(Integer, ForeignKey("bets.id"), nullable=True)
    ref_request_id = Column(Integer, ForeignKey("topup_requests.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)
