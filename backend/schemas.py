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
    parent_group_id: Optional[int] = None


class GroupJoinRequest(BaseModel):
    invite_code: str


class GroupSummary(BaseModel):
    id: int
    name: str
    invite_code: str
    leader_id: int
    is_member: bool
    my_balance: int
    parent_group_name: Optional[str] = None


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
    closes_at: Optional[datetime.datetime]
    hidden_from_names: List[str]
    created_at: datetime.datetime


class GroupDetail(BaseModel):
    id: int
    name: str
    invite_code: str
    leader_id: int
    my_balance: int
    parent_group_id: Optional[int]
    parent_group_name: Optional[str]
    subgroups: List[GroupSummary]
    invitable_members: List[MemberBalance]
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
    closes_at: Optional[datetime.datetime] = None
    hidden_from_user_ids: Optional[List[int]] = None


class StakeCreateRequest(BaseModel):
    option_index: int = Field(ge=0)
    amount: int = Field(gt=0)


class ResolveRequest(BaseModel):
    winning_option: int = Field(ge=0)


class BetEditRequest(BaseModel):
    question: str = Field(min_length=1, max_length=280)
    options: List[str] = Field(min_length=2, max_length=8)


class StakeOut(BaseModel):
    id: int
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
    closes_at: Optional[datetime.datetime]
    hidden_from_names: List[str]
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


class VoteCreateRequest(BaseModel):
    type: str  # change_leader | dispute_resolution
    target_user_id: Optional[int] = None
    target_bet_id: Optional[int] = None
    reason: Optional[str] = Field(default=None, max_length=280)


class BallotRequest(BaseModel):
    choice: str  # yes | no


class VoteOut(BaseModel):
    id: int
    group_id: int
    type: str
    initiator_id: int
    initiator_name: str
    target_user_id: Optional[int]
    target_user_name: Optional[str]
    target_bet_id: Optional[int]
    target_bet_question: Optional[str]
    reason: Optional[str]
    status: str
    yes_count: int
    no_count: int
    total_members: int
    my_choice: Optional[str]
    closes_at: datetime.datetime
    created_at: datetime.datetime


GroupDetail.model_rebuild()
