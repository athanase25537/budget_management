from pydantic import BaseModel
from typing import Optional
from backend.models.budget_management_models import CategoryType

class Category_create(BaseModel):
    name: str 
    user_id: Optional[int] = None
    color: str
    type: CategoryType = CategoryType.INCOME

class Category_update(BaseModel):
    name: str
    color: str
    type: CategoryType = CategoryType.INCOME