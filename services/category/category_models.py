from pydantic import BaseModel
from typing import Optional

class Category_create(BaseModel):
    name: str 
    user_id: Optional[int] = None

class Category_update(BaseModel):
    name: str 