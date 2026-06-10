from pydantic import BaseModel
from datetime import datetime

class Category_create(BaseModel):
    name: str 
    user_id: int

class Category_update(BaseModel):
    name: str 