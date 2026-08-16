import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import get_group_or_404, get_membership_or_403, log_event
from backend.models import Bet, Group, GroupVote, Membership, Transaction, User, VoteBallot
from backend.schemas import BallotRequest, VoteCreateRequest, VoteOut

router = APIRouter(tags=["votes"])

VOTE_WINDOW_HOURS = 48
PASS_THRESHOLD = 0.6
# Once "no" alone exceeds this fraction of total membership, 60% yes is no
# longer mathematically reachable -- fail early instead of waiting out the clock.
FAIL_THRESHOLD = 1 - PASS_THRESHOLD


def _total_members(db: Session, group_id: int) -> int:
    return db.query(Membership).filter(Membership.group_id == group_id).count()


def _tally(db: Session, vote_id: int):
    yes = db.query(VoteBallot).filter(VoteBallot.vote_id == vote_id, VoteBallot.choice == "yes").count()
    no = db.query(VoteBallot).filter(VoteBallot.vote_id == vote_id, VoteBallot.choice == "no").count()
    return yes, no


def _revert_resolution(db: Session, bet: Bet):
    """Undo a bet's payout/refund, reopening it for a fresh resolution.
    Adds offsetting 'reversal' transactions rather than deleting the
    original payout/refund rows, so the ledger keeps a full audit trail."""
    txns = (
        db.query(Transaction)
        .filter(Transaction.ref_bet_id == bet.id, Transaction.type.in_(["payout", "refund"]))
        .all()
    )
    for t in txns:
        membership = get_membership_or_403(db, bet.group_id, t.user_id, for_update=True)
        membership.balance -= t.amount
        db.add(
            Transaction(
                group_id=bet.group_id, user_id=t.user_id, type="reversal", amount=-t.amount,
                balance_after=membership.balance, ref_bet_id=bet.id,
            )
        )
    bet.status = "open"
    bet.winning_option = None
    bet.resolved_at = None
    bet.resolved_by = None


def _apply_vote(db: Session, vote: GroupVote, group: Group):
    if vote.type == "change_leader":
        old_leader = db.get(User, group.leader_id)
        new_leader = db.get(User, vote.target_user_id)
        group.leader_id = vote.target_user_id
        log_event(
            db, group.id, vote.initiator_id, "leader_changed",
            f"{new_leader.display_name} is now the leader (replacing {old_leader.display_name}) after a group vote",
        )
    else:  # dispute_resolution
        bet = db.get(Bet, vote.target_bet_id)
        _revert_resolution(db, bet)
        log_event(
            db, group.id, vote.initiator_id, "resolution_reverted",
            f'The resolution of "{bet.question}" was overturned by a group vote and reopened', ref_bet_id=bet.id,
        )


def _maybe_finalize(db: Session, vote: GroupVote, group: Group, total_members: int):
    """Lazily resolve a vote: called on every read/ballot instead of via a
    background job, matching how the bet-closing timer is enforced elsewhere
    in this app (checked at request time, not on a schedule)."""
    if vote.status != "open":
        return
    yes, no = _tally(db, vote.id)
    passed = None
    if total_members > 0 and yes / total_members >= PASS_THRESHOLD:
        passed = True
    elif total_members > 0 and no / total_members > FAIL_THRESHOLD:
        passed = False
    elif datetime.datetime.utcnow() >= vote.closes_at:
        passed = total_members > 0 and yes / total_members >= PASS_THRESHOLD

    if passed is None:
        return

    vote.status = "passed" if passed else "failed"
    vote.resolved_at = datetime.datetime.utcnow()
    if passed:
        _apply_vote(db, vote, group)

    what = "Change leader" if vote.type == "change_leader" else "Dispute"
    log_event(
        db, vote.group_id, vote.initiator_id, "vote_resolved",
        f'{what} vote {"passed" if passed else "failed"} ({yes} yes / {no} no of {total_members} members)',
        ref_bet_id=vote.target_bet_id,
    )


def _to_vote_out(db: Session, vote: GroupVote, viewer_id: int) -> VoteOut:
    yes, no = _tally(db, vote.id)
    total = _total_members(db, vote.group_id)
    initiator = db.get(User, vote.initiator_id)
    target_user_name = db.get(User, vote.target_user_id).display_name if vote.target_user_id else None
    target_bet_question = db.get(Bet, vote.target_bet_id).question if vote.target_bet_id else None
    my_ballot = (
        db.query(VoteBallot).filter(VoteBallot.vote_id == vote.id, VoteBallot.user_id == viewer_id).first()
    )
    return VoteOut(
        id=vote.id, group_id=vote.group_id, type=vote.type, initiator_id=vote.initiator_id,
        initiator_name=initiator.display_name, target_user_id=vote.target_user_id,
        target_user_name=target_user_name, target_bet_id=vote.target_bet_id,
        target_bet_question=target_bet_question, reason=vote.reason, status=vote.status,
        yes_count=yes, no_count=no, total_members=total,
        my_choice=my_ballot.choice if my_ballot else None, closes_at=vote.closes_at, created_at=vote.created_at,
    )


@router.post("/api/groups/{group_id}/votes", response_model=VoteOut)
def create_vote(
    group_id: int, body: VoteCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    group = get_group_or_404(db, group_id)
    # No superadmin bypass -- starting a vote is a member action, and a
    # superadmin's ballot would otherwise count toward yes/no without
    # counting toward total_members (it's not a real Membership row).
    get_membership_or_403(db, group_id, user.id, allow_superadmin=False)

    if body.type not in ("change_leader", "dispute_resolution"):
        raise HTTPException(status_code=400, detail="Invalid vote type")

    target_bet = None
    if body.type == "change_leader":
        if not body.target_user_id:
            raise HTTPException(status_code=400, detail="target_user_id is required")
        if body.target_user_id == group.leader_id:
            raise HTTPException(status_code=400, detail="That person is already the leader")
        get_membership_or_403(db, group_id, body.target_user_id)
    else:
        if not body.target_bet_id:
            raise HTTPException(status_code=400, detail="target_bet_id is required")
        target_bet = db.get(Bet, body.target_bet_id)
        if target_bet is None or target_bet.group_id != group_id:
            raise HTTPException(status_code=404, detail="Bet not found in this group")
        if target_bet.status != "resolved":
            raise HTTPException(status_code=400, detail="Can only dispute a resolved bet")

    existing_open = (
        db.query(GroupVote)
        .filter(
            GroupVote.group_id == group_id, GroupVote.type == body.type, GroupVote.status == "open",
            GroupVote.target_user_id == body.target_user_id, GroupVote.target_bet_id == body.target_bet_id,
        )
        .first()
    )
    if existing_open:
        raise HTTPException(status_code=400, detail="There's already an open vote for this")

    vote = GroupVote(
        group_id=group_id, type=body.type, initiator_id=user.id, target_user_id=body.target_user_id,
        target_bet_id=body.target_bet_id, reason=body.reason,
        closes_at=datetime.datetime.utcnow() + datetime.timedelta(hours=VOTE_WINDOW_HOURS),
    )
    db.add(vote)
    db.flush()

    if body.type == "change_leader":
        target_name = db.get(User, body.target_user_id).display_name
        message = f"{user.display_name} started a vote to make {target_name} the leader"
    else:
        message = f'{user.display_name} disputed the resolution of "{target_bet.question}"'
    log_event(db, group_id, user.id, "vote_started", message, ref_bet_id=body.target_bet_id)

    db.commit()
    db.refresh(vote)
    return _to_vote_out(db, vote, user.id)


@router.get("/api/groups/{group_id}/votes", response_model=list[VoteOut])
def list_votes(group_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    group = get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)

    total = _total_members(db, group_id)
    votes = (
        db.query(GroupVote)
        .filter(GroupVote.group_id == group_id)
        .order_by(GroupVote.created_at.desc())
        .limit(20)
        .all()
    )
    for v in votes:
        if v.status == "open":
            # Re-fetch under a row lock right before finalizing: a plain read
            # (like the query above) doesn't stop two concurrent requests
            # from both seeing "open" and both applying the outcome (e.g.
            # double-reversing a disputed payout).
            locked = db.get(GroupVote, v.id, with_for_update=True)
            _maybe_finalize(db, locked, group, total)
    db.commit()

    return [_to_vote_out(db, v, user.id) for v in votes]


@router.post("/api/votes/{vote_id}/ballot", response_model=VoteOut)
def cast_ballot(
    vote_id: int, body: BallotRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    vote = db.get(GroupVote, vote_id, with_for_update=True)
    if vote is None:
        raise HTTPException(status_code=404, detail="Vote not found")
    group = get_group_or_404(db, vote.group_id)
    get_membership_or_403(db, vote.group_id, user.id, allow_superadmin=False)

    if body.choice not in ("yes", "no"):
        raise HTTPException(status_code=400, detail="choice must be 'yes' or 'no'")

    total = _total_members(db, vote.group_id)
    _maybe_finalize(db, vote, group, total)
    if vote.status != "open":
        db.commit()
        raise HTTPException(status_code=400, detail="This vote has already closed")

    existing = (
        db.query(VoteBallot).filter(VoteBallot.vote_id == vote_id, VoteBallot.user_id == user.id).first()
    )
    if existing:
        existing.choice = body.choice
    else:
        db.add(VoteBallot(vote_id=vote_id, user_id=user.id, choice=body.choice))
    db.flush()

    _maybe_finalize(db, vote, group, total)
    db.commit()
    return _to_vote_out(db, vote, user.id)
