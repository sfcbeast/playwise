import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=6)
    display_name: str = Field(min_length=1, max_length=64)
    accepted_terms: bool = False


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    display_name: str


# Fixed, validated set -- keeps the discovery filter meaningful instead of
# accumulating one-off free-text categories nobody else uses.
GROUP_CATEGORIES = ["general", "sports", "politics", "current_affairs", "stocks", "entertainment"]


class GroupCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    parent_group_id: Optional[int] = None
    is_public: bool = False
    category: Optional[str] = None
    rules: Optional[str] = Field(default=None, max_length=2000)


class GroupJoinRequest(BaseModel):
    invite_code: str


class PublicJoinRequest(BaseModel):
    accepted_rules: bool = False


class GroupSettingsUpdateRequest(BaseModel):
    is_public: bool
    category: Optional[str] = None
    rules: Optional[str] = Field(default=None, max_length=2000)


class GroupSummary(BaseModel):
    id: int
    name: str
    invite_code: str
    leader_id: int
    is_member: bool
    my_balance: int
    parent_group_name: Optional[str] = None
    is_public: bool = False
    category: Optional[str] = None


class PublicGroupOut(BaseModel):
    id: int
    name: str
    category: Optional[str]
    leader_display_name: str
    member_count: int
    has_rules: bool
    rules: Optional[str]
    is_member: bool
    created_at: datetime.datetime


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
    image_data: Optional[str] = None
    created_at: datetime.datetime


class GroupDetail(BaseModel):
    id: int
    name: str
    invite_code: str
    leader_id: int
    my_balance: int
    parent_group_id: Optional[int]
    parent_group_name: Optional[str]
    is_public: bool = False
    category: Optional[str] = None
    rules: Optional[str] = None
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
    image_data: Optional[str] = Field(default=None, max_length=2_800_000)  # ~2MB decoded, base64 data URL


class StakeCreateRequest(BaseModel):
    option_index: int = Field(ge=0)
    amount: int = Field(gt=0)


class ResolveRequest(BaseModel):
    winning_option: int = Field(ge=0)


class BetEditRequest(BaseModel):
    question: str = Field(min_length=1, max_length=280)
    options: List[str] = Field(min_length=2, max_length=8)
    image_data: Optional[str] = Field(default=None, max_length=2_800_000)
    remove_image: bool = False


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
    image_data: Optional[str] = None
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


class ChatMessageCreateRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class ChatMessageOut(BaseModel):
    id: int
    user_id: int
    display_name: str
    message: str
    created_at: datetime.datetime


GroupDetail.model_rebuild()
