from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Transaction_create(BaseModel):
    amount: float
    is_in: bool
    user_id: int
    date: datetime
    reason: Optional[str] = None
    category_id: int

class Transaction_update(BaseModel):
    amount: float
    is_in: bool
    date: datetime
    reason: Optional[str] = None
    category_id: int