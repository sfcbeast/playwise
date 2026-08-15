import datetime
import secrets

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.db import Base


def utcnow():
    return datetime.datetime.utcnow()


def gen_invite_code():
    return secrets.token_hex(4)


# Excludes visually ambiguous characters (0/O, 1/I/L) so a hand-copied code
# doesn't fail to verify because of a misread character.
_RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def gen_recovery_code():
    groups = ["".join(secrets.choice(_RECOVERY_ALPHABET) for _ in range(4)) for _ in range(3)]
    return "-".join(groups)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    # Recorded, not just shown -- an affirmative, timestamped acknowledgment
    # that coins are play money only is what app-store review (and any
    # future "did users actually know this" question) needs, not just
    # footer text nobody reads.
    terms_accepted_at = Column(DateTime, nullable=True)
    # Hashed like a password, never stored or logged in plaintext -- the
    # plaintext code is shown to the user exactly once (at generation) and
    # is the only self-service path back into an account, since there's no
    # email service wired up to send reset links through.
    recovery_code_hash = Column(String, nullable=True)
    # No self-service path to this -- nobody starts as admin, including
    # whoever registers first. Granted manually via direct DB access, same
    # spirit as everything else in this app that touches trust boundaries.
    is_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=utcnow)


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    invite_code = Column(String, unique=True, nullable=False, default=gen_invite_code, index=True)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    # Discovery: a public group is searchable/joinable by anyone without an
    # invite code (subject to accepting the leader's rules, if any are set).
    # Private groups (the default -- existing behavior) never show up there.
    is_public = Column(Boolean, nullable=False, default=False)
    category = Column(String, nullable=True)
    rules = Column(Text, nullable=True)
    # Optional -- None means "no default, join with 0" (today's behavior
    # unchanged). When set, every new membership in this group (leader's
    # own included, at creation) starts at this balance instead of 0, so
    # everyone's even before the first question gets asked.
    starting_balance = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    leader = relationship("User")


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    balance = Column(Integer, nullable=False, default=0)
    joined_at = Column(DateTime, default=utcnow)
    # Set only when joining a public group that had rules at the time --
    # an audit trail mirroring User.terms_accepted_at, so "did they actually
    # agree to this" has an answer beyond footer text nobody reads.
    rules_accepted_at = Column(DateTime, nullable=True)

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
    image_data = Column(Text, nullable=True)  # optional "data:image/...;base64,..." URL, stored inline
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


class BetHiddenFrom(Base):
    """Incognito questions: rows here mean the named user can't see this
    bet at all -- not in lists, not in the event feed, not by direct id."""
    __tablename__ = "bet_hidden_from"
    __table_args__ = (UniqueConstraint("bet_id", "user_id", name="uq_bet_hidden_from"),)

    id = Column(Integer, primary_key=True)
    bet_id = Column(Integer, ForeignKey("bets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)


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
    type = Column(String, nullable=False)  # topup/stake/payout/refund/reversal
    amount = Column(Integer, nullable=False)  # signed: + credit, - debit
    balance_after = Column(Integer, nullable=False)
    ref_bet_id = Column(Integer, ForeignKey("bets.id"), nullable=True)
    ref_request_id = Column(Integer, ForeignKey("topup_requests.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)


class GroupVote(Base):
    __tablename__ = "group_votes"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    type = Column(String, nullable=False)  # change_leader | dispute_resolution
    initiator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # proposed leader
    target_bet_id = Column(Integer, ForeignKey("bets.id"), nullable=True)  # disputed bet
    reason = Column(String, nullable=True)
    status = Column(String, nullable=False, default="open")  # open/passed/failed
    closes_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)


class VoteBallot(Base):
    __tablename__ = "vote_ballots"
    __table_args__ = (UniqueConstraint("vote_id", "user_id", name="uq_vote_ballot_voter"),)

    id = Column(Integer, primary_key=True)
    vote_id = Column(Integer, ForeignKey("group_votes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    choice = Column(String, nullable=False)  # yes | no
    created_at = Column(DateTime, default=utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)  # null = the site-wide global chat
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)


class Report(Base):
    """Site-wide moderation queue -- anyone can flag a chat message or a
    public group; only an admin can see or act on the queue. This is
    deliberately separate from group-level moderation (leaders can already
    delete messages/kick members in their own group) -- it's for things a
    group leader has no authority over, like abuse in global chat or a
    public group's name/rules themselves being the problem."""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(String, nullable=False)  # chat_message | group
    target_id = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, nullable=False, default="open")  # open | resolved
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
