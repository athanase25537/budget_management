from pydantic import BaseModel
from datetime import datetime

class Transaction_create(BaseModel):
    amount: float
    is_in: bool
    user_id: int
    date: datetime
    reason: str
    category_id: int

class Transaction_update(BaseModel):
    amount: float
    is_in: bool
    date: datetime
    reason: str
    category_id: int