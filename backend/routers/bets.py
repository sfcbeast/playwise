import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.db import get_db
from backend.helpers import get_group_or_404, get_membership_or_403, require_leader
from backend.models import Bet, Membership, Stake, Transaction, User
from backend.schemas import BetCreateRequest, BetDetail, BetSummary, ResolveRequest, StakeCreateRequest, StakeOut

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


@router.post("/api/groups/{group_id}/bets", response_model=BetSummary)
def create_bet(
    group_id: int, body: BetCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    get_group_or_404(db, group_id)
    get_membership_or_403(db, group_id, user.id)

    bet = Bet(group_id=group_id, creator_id=user.id, question=body.question, options=body.options)
    db.add(bet)
    db.commit()
    db.refresh(bet)
    return BetSummary(
        id=bet.id, question=bet.question, options=bet.options, status=bet.status,
        winning_option=bet.winning_option, creator_id=bet.creator_id,
        option_totals=[0] * len(bet.options), created_at=bet.created_at,
    )


@router.get("/api/bets/{bet_id}", response_model=BetDetail)
def get_bet(bet_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    bet = _get_bet_or_404(db, bet_id)
    get_membership_or_403(db, bet.group_id, user.id)

    all_stakes = db.query(Stake).filter(Stake.bet_id == bet_id).all()
    stakes_out = []
    my_stakes_out = []
    for s in all_stakes:
        stake_user = db.get(User, s.user_id)
        out = StakeOut(user_id=s.user_id, display_name=stake_user.display_name, option_index=s.option_index, amount=s.amount)
        stakes_out.append(out)
        if s.user_id == user.id:
            my_stakes_out.append(out)

    return BetDetail(
        id=bet.id, group_id=bet.group_id, question=bet.question, options=bet.options, status=bet.status,
        winning_option=bet.winning_option, creator_id=bet.creator_id,
        option_totals=_option_totals(db, bet), my_stakes=my_stakes_out, stakes=stakes_out,
    )


@router.post("/api/bets/{bet_id}/stake", response_model=BetDetail)
def place_stake(
    bet_id: int, body: StakeCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    bet = _get_bet_or_404(db, bet_id)
    membership = get_membership_or_403(db, bet.group_id, user.id)

    if bet.status != "open":
        raise HTTPException(status_code=400, detail="This bet is no longer open")
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
    db.commit()
    return get_bet(bet_id, db, user)


@router.post("/api/bets/{bet_id}/resolve", response_model=BetDetail)
def resolve_bet(
    bet_id: int, body: ResolveRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    bet = _get_bet_or_404(db, bet_id)
    group = get_group_or_404(db, bet.group_id)
    require_leader(group, user.id)

    if bet.status != "open":
        raise HTTPException(status_code=400, detail="This bet is already resolved")
    if body.winning_option >= len(bet.options):
        raise HTTPException(status_code=400, detail="Invalid option")

    all_stakes = db.query(Stake).filter(Stake.bet_id == bet_id).all()
    total_pool = sum(s.amount for s in all_stakes)
    winning_stakes = [s for s in all_stakes if s.option_index == body.winning_option]
    winning_pool = sum(s.amount for s in winning_stakes)

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
    db.commit()
    return get_bet(bet_id, db, user)
