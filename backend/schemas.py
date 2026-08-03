import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=6)
    display_name: str = Field(min_length=1, max_length=64)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    display_name: str


class GroupCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class GroupJoinRequest(BaseModel):
    invite_code: str


class GroupSummary(BaseModel):
    id: int
    name: str
    invite_code: str
    leader_id: int
    my_balance: int


class MemberBalance(BaseModel):
    user_id: int
    display_name: str
    username: str
    balance: int


class BetSummary(BaseModel):
    id: int
    question: str
    options: List[str]
    status: str
    winning_option: Optional[int]
    creator_id: int
    option_totals: List[int]
    created_at: datetime.datetime


class GroupDetail(BaseModel):
    id: int
    name: str
    invite_code: str
    leader_id: int
    my_balance: int
    members: List[MemberBalance]
    bets: List[BetSummary]
    pending_topups: List["TopUpRequestOut"]
    latest_event_id: int


class TopUpCreateRequest(BaseModel):
    amount: int = Field(gt=0)


class TopUpRequestOut(BaseModel):
    id: int
    group_id: int
    user_id: int
    display_name: str
    amount: int
    status: str
    created_at: datetime.datetime


class BetCreateRequest(BaseModel):
    question: str = Field(min_length=1, max_length=280)
    options: List[str] = Field(min_length=2, max_length=8)


class StakeCreateRequest(BaseModel):
    option_index: int = Field(ge=0)
    amount: int = Field(gt=0)


class ResolveRequest(BaseModel):
    winning_option: int = Field(ge=0)


class StakeOut(BaseModel):
    user_id: int
    display_name: str
    option_index: int
    amount: int


class PayoutOut(BaseModel):
    user_id: int
    display_name: str
    type: str  # payout | refund
    amount: int


class BetDetail(BaseModel):
    id: int
    group_id: int
    question: str
    options: List[str]
    status: str
    winning_option: Optional[int]
    creator_id: int
    option_totals: List[int]
    my_stakes: List[StakeOut]
    stakes: List[StakeOut]
    payouts: List[PayoutOut]


class TransactionOut(BaseModel):
    id: int
    type: str
    amount: int
    balance_after: int
    ref_bet_id: Optional[int]
    ref_request_id: Optional[int]
    created_at: datetime.datetime


class EventOut(BaseModel):
    id: int
    type: str
    actor_id: int
    actor_name: str
    message: str
    ref_bet_id: Optional[int]
    created_at: datetime.datetime


GroupDetail.model_rebuild()
