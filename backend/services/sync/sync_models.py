from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field

from backend.models.budget_management_models import CategoryType


class CategorySyncChange(BaseModel):
    client_id: str = Field(min_length=1, max_length=36)
    remote_id: Optional[int] = None
    operation: Literal["create", "update", "delete"]
    updated_at: datetime
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    color: Optional[str] = None
    type: Optional[CategoryType] = None
    budget_amount: Optional[Decimal] = Field(default=None, ge=0, max_digits=12, decimal_places=2)


class TransactionSyncChange(BaseModel):
    client_id: str = Field(min_length=1, max_length=36)
    remote_id: Optional[int] = None
    operation: Literal["create", "update", "delete"]
    updated_at: datetime
    amount: Optional[Decimal] = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    is_in: Optional[bool] = None
    date: Optional[datetime] = None
    reason: Optional[str] = None
    category_remote_id: Optional[int] = None
    category_client_id: Optional[str] = Field(default=None, min_length=1, max_length=36)


class SyncRequest(BaseModel):
    categories: list[CategorySyncChange] = []
    transactions: list[TransactionSyncChange] = []

