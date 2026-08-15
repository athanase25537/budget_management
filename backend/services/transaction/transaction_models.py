from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class Transaction_create(BaseModel):
    amount: float = Field(gt=0)
    is_in: bool
    user_id: int
    date: datetime
    reason: Optional[str] = None
    category_id: int

class Transaction_update(BaseModel):
    amount: float = Field(gt=0)
    is_in: bool
    date: datetime
    reason: Optional[str] = None
    category_id: int
