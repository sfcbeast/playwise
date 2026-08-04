import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import get_group_or_404, get_membership_or_403, log_event, require_creator_or_leader
from backend.models import Bet, BetHiddenFrom, Membership, Stake, Transaction, User
from backend.schemas import (
    BetCreateRequest,
    BetDetail,
    BetEditRequest,
    BetSummary,
    PayoutOut,
    ResolveRequest,
    StakeCreateRequest,
    StakeOut,
)

router = APIRouter(tags=["bets"])


def _option_totals(db: Session, bet: Bet):
    totals = [0] * len(bet.options)
    for stake in db.query(Stake).filter(Stake.bet_id == bet.id).all():
        totals[stake.option_index] += stake.amount
    return totals


def _get_bet_or_404(db: Session, bet_id: int) -> Bet:
    bet = db.get(Bet, bet_id)
    if bet is None:
        raise HTTPException(status_code=404, detail="Bet not found")
    return bet


def _ensure_visible(db: Session, bet_id: int, user_id: int):
    """Incognito questions: a blinded user gets exactly the same 404 as a
    genuinely nonexistent bet, everywhere -- lists, direct fetch, and every
    mutating endpoint below (checked before any mutation happens, not just
    on the final response, so a guessed bet id can't be used to sneak a
    stake in past the block)."""
    hidden = (
        db.query(BetHiddenFrom).filter(BetHiddenFrom.bet_id == bet_id, BetHiddenFrom.user_id == user_id).first()
    )
    if hidden:
        raise HTTPException(status_code=404, detail="Bet not found")


def _hidden_from_names(db: Session, bet_id: int):
    rows = db.query(BetHiddenFrom).filter(BetHiddenFrom.bet_id == bet_id).all()
    return [db.get(User, r.user_id).display_name for r in rows]


def _payouts(db: Session, bet_id: int):
    rows = (
        db.query(Transaction)
        .filter(Transaction.ref_bet_id == bet_id, Transaction.type.in_(["payout", "refund"]))
        .all()
    )
    totals = {}  # (user_id, type) -> amount
    for r in rows:
        key = (r.user_id, r.type)
        totals[key] = totals.get(key, 0) + r.amount
    out = []
    for (user_id, type_), amount in sorted(totals.items(), key=lambda kv: -kv[1]):
        u = db.get(User, user_id)
        out.append(PayoutOut(user_id=user_id, display_name=u.display_name, type=type_, amount=amount))
    return out


@router.post("/api/groups/{group_id}/bets", response_model=BetSummary)
def create_bet(
    group_id: int, body: BetCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)

    closes_at = body.closes_at
    if closes_at is not None:
        closes_at = closes_at.replace(tzinfo=None)  # client always sends UTC; store naive UTC like everything else
        if closes_at <= datetime.datetime.utcnow():
            raise HTTPException(status_code=400, detail="Closing time must be in the future")

    hidden_from_ids = set(body.hidden_from_user_ids or [])
    hidden_from_ids.discard(user.id)  # can't hide your own question from yourself
    for uid in hidden_from_ids:
        get_membership_or_403(db, group_id, uid)

    bet = Bet(
        group_id=group_id, creator_id=user.id, question=body.question, options=body.options, closes_at=closes_at
    )
    db.add(bet)
    db.flush()
    for uid in hidden_from_ids:
        db.add(BetHiddenFrom(bet_id=bet.id, user_id=uid))
    log_event(
        db, group_id, user.id, "bet_created",
        f'{user.display_name} posted a new question: "{body.question}"',
        ref_bet_id=bet.id,
    )
    db.commit()
    db.refresh(bet)
    return BetSummary(
        id=bet.id, question=bet.question, options=bet.options, status=bet.status,
        winning_option=bet.winning_option, creator_id=bet.creator_id,
        option_totals=[0] * len(bet.options), closes_at=bet.closes_at,
        hidden_from_names=_hidden_from_names(db, bet.id), created_at=bet.created_at,
    )


@router.get("/api/bets/{bet_id}", response_model=BetDetail)
def get_bet(bet_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    bet = _get_bet_or_404(db, bet_id)
    get_membership_or_403(db, bet.group_id, user.id)
    _ensure_visible(db, bet_id, user.id)

    all_stakes = db.query(Stake).filter(Stake.bet_id == bet_id).all()
    stakes_out = []
    my_stakes_out = []
    for s in all_stakes:
        stake_user = db.get(User, s.user_id)
        out = StakeOut(id=s.id, user_id=s.user_id, display_name=stake_user.display_name, option_index=s.option_index, amount=s.amount)
        stakes_out.append(out)
        if s.user_id == user.id:
            my_stakes_out.append(out)

    return BetDetail(
        id=bet.id, group_id=bet.group_id, question=bet.question, options=bet.options, status=bet.status,
        winning_option=bet.winning_option, creator_id=bet.creator_id,
        option_totals=_option_totals(db, bet), closes_at=bet.closes_at,
        hidden_from_names=_hidden_from_names(db, bet_id),
        my_stakes=my_stakes_out, stakes=stakes_out,
        payouts=_payouts(db, bet_id) if bet.status == "resolved" else [],
    )


@router.patch("/api/bets/{bet_id}", response_model=BetDetail)
def edit_bet(
    bet_id: int, body: BetEditRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    bet = _get_bet_or_404(db, bet_id)
    get_membership_or_403(db, bet.group_id, user.id)
    _ensure_visible(db, bet_id, user.id)

    if user.id != bet.creator_id:
        raise HTTPException(status_code=403, detail="Only the question's creator can edit it")
    if bet.status != "open":
        raise HTTPException(status_code=400, detail="Can't edit a bet that's already resolved")
    if db.query(Stake).filter(Stake.bet_id == bet_id).count() > 0:
        raise HTTPException(status_code=400, detail="Can't edit a question once people have staked on it")

    bet.question = body.question
    bet.options = body.options
    log_event(db, bet.group_id, user.id, "bet_edited", f'{user.display_name} edited a question: "{body.question}"', ref_bet_id=bet.id)
    db.commit()
    return get_bet(bet_id, db, user)


@router.delete("/api/bets/{bet_id}", response_model=dict)
def delete_bet(bet_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    bet = _get_bet_or_404(db, bet_id)
    group = get_group_or_404(db, bet.group_id)
    get_membership_or_403(db, bet.group_id, user.id)
    _ensure_visible(db, bet_id, user.id)
    require_creator_or_leader(bet, group, user.id)

    if bet.status != "open":
        raise HTTPException(status_code=400, detail="Can't delete a bet that's already resolved")

    all_stakes = db.query(Stake).filter(Stake.bet_id == bet_id).all()
    for s in all_stakes:
        membership = (
            db.query(Membership)
            .filter(Membership.group_id == bet.group_id, Membership.user_id == s.user_id)
            .first()
        )
        membership.balance += s.amount
        db.add(
            Transaction(
                group_id=bet.group_id, user_id=s.user_id, type="refund", amount=s.amount,
                balance_after=membership.balance, ref_bet_id=bet.id,
            )
        )

    # Soft-delete: existing Transaction/GroupEvent rows already reference this
    # bet's id via foreign key, so a real DELETE would fail (Postgres enforces
    # it; SQLite silently doesn't, which would've hidden this locally).
    bet.status = "deleted"
    log_event(
        db, bet.group_id, user.id, "bet_deleted",
        f'{user.display_name} deleted the question "{bet.question}"' + (" — stakes refunded" if all_stakes else ""),
        ref_bet_id=bet.id,
    )
    db.commit()
    return {"ok": True}


@router.post("/api/bets/{bet_id}/stake", response_model=BetDetail)
def place_stake(
    bet_id: int, body: StakeCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    bet = _get_bet_or_404(db, bet_id)
    membership = get_membership_or_403(db, bet.group_id, user.id)
    _ensure_visible(db, bet_id, user.id)

    if bet.status != "open":
        raise HTTPException(status_code=400, detail="This bet is no longer open")
    if bet.closes_at is not None and datetime.datetime.utcnow() >= bet.closes_at:
        raise HTTPException(status_code=400, detail="Staking has closed for this question")
    if body.option_index >= len(bet.options):
        raise HTTPException(status_code=400, detail="Invalid option")
    if membership.balance < body.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    membership.balance -= body.amount
    db.add(Stake(bet_id=bet.id, user_id=user.id, option_index=body.option_index, amount=body.amount))
    db.add(
        Transaction(
            group_id=bet.group_id, user_id=user.id, type="stake", amount=-body.amount,
            balance_after=membership.balance, ref_bet_id=bet.id,
        )
    )
    log_event(
        db, bet.group_id, user.id, "stake_placed",
        f'{user.display_name} staked {body.amount} coins on "{bet.options[body.option_index]}" for "{bet.question}"',
        ref_bet_id=bet.id,
    )
    db.commit()
    return get_bet(bet_id, db, user)


@router.delete("/api/bets/{bet_id}/stakes/{stake_id}", response_model=BetDetail)
def retract_stake(
    bet_id: int, stake_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    bet = _get_bet_or_404(db, bet_id)
    membership = get_membership_or_403(db, bet.group_id, user.id)
    _ensure_visible(db, bet_id, user.id)

    stake = db.get(Stake, stake_id)
    if stake is None or stake.bet_id != bet_id:
        raise HTTPException(status_code=404, detail="Stake not found")
    if stake.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only retract your own stake")
    if bet.status != "open":
        raise HTTPException(status_code=400, detail="Can't retract a stake once the bet is resolved")

    membership.balance += stake.amount
    db.add(
        Transaction(
            group_id=bet.group_id, user_id=user.id, type="refund", amount=stake.amount,
            balance_after=membership.balance, ref_bet_id=bet.id,
        )
    )
    log_event(
        db, bet.group_id, user.id, "stake_retracted",
        f'{user.display_name} retracted a {stake.amount}-coin stake on "{bet.options[stake.option_index]}" for "{bet.question}"',
        ref_bet_id=bet.id,
    )
    db.delete(stake)
    db.commit()
    return get_bet(bet_id, db, user)


@router.post("/api/bets/{bet_id}/resolve", response_model=BetDetail)
def resolve_bet(
    bet_id: int, body: ResolveRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    bet = _get_bet_or_404(db, bet_id)
    group = get_group_or_404(db, bet.group_id)
    _ensure_visible(db, bet_id, user.id)
    require_creator_or_leader(bet, group, user.id)

    if bet.status != "open":
        raise HTTPException(status_code=400, detail="This bet is already resolved")
    if body.winning_option >= len(bet.options):
        raise HTTPException(status_code=400, detail="Invalid option")

    all_stakes = db.query(Stake).filter(Stake.bet_id == bet_id).all()
    total_pool = sum(s.amount for s in all_stakes)
    winning_stakes = [s for s in all_stakes if s.option_index == body.winning_option]
    winning_pool = sum(s.amount for s in winning_stakes)

    winning_option_text = bet.options[body.winning_option]
    winner_amounts = {}  # user_id -> payout amount, for the event message

    if winning_pool == 0:
        # Nobody picked the winning option: nothing to distribute, refund every stake.
        for s in all_stakes:
            membership = (
                db.query(Membership)
                .filter(Membership.group_id == bet.group_id, Membership.user_id == s.user_id)
                .first()
            )
            membership.balance += s.amount
            db.add(
                Transaction(
                    group_id=bet.group_id, user_id=s.user_id, type="refund", amount=s.amount,
                    balance_after=membership.balance, ref_bet_id=bet.id,
                )
            )
    else:
        # Pari-mutuel payout: winners split the entire pool proportional to their stake.
        # Floor division means a few leftover coins may go unallocated rather than risk overpaying.
        for s in winning_stakes:
            payout = s.amount * total_pool // winning_pool
            membership = (
                db.query(Membership)
                .filter(Membership.group_id == bet.group_id, Membership.user_id == s.user_id)
                .first()
            )
            membership.balance += payout
            winner_amounts[s.user_id] = winner_amounts.get(s.user_id, 0) + payout
            db.add(
                Transaction(
                    group_id=bet.group_id, user_id=s.user_id, type="payout", amount=payout,
                    balance_after=membership.balance, ref_bet_id=bet.id,
                )
            )

    bet.status = "resolved"
    bet.winning_option = body.winning_option
    bet.resolved_at = datetime.datetime.utcnow()
    bet.resolved_by = user.id

    if winner_amounts:
        breakdown = ", ".join(
            f"{db.get(User, uid).display_name} +{amt}"
            for uid, amt in sorted(winner_amounts.items(), key=lambda kv: -kv[1])
        )
        message = f'"{bet.question}" resolved — "{winning_option_text}" won. {breakdown} coins.'
    else:
        message = (
            f'"{bet.question}" resolved — "{winning_option_text}" won, but nobody staked on it. '
            f"All stakes were refunded."
        )
    log_event(db, bet.group_id, user.id, "bet_resolved", message, ref_bet_id=bet.id)

    db.commit()
    return get_bet(bet_id, db, user)
