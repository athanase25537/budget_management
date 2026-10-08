from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

class Transaction_create(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    is_in: bool
    user_id: int
    date: datetime
    reason: Optional[str] = None
    category_id: int

    @field_validator("date")
    @classmethod
    def normalize_date(cls, value: datetime) -> datetime:
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)

class Transaction_update(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    is_in: bool
    date: datetime
    reason: Optional[str] = None
    category_id: int

    @field_validator("date")
    @classmethod
    def normalize_date(cls, value: datetime) -> datetime:
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
