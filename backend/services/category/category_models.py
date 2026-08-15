from pydantic import BaseModel, Field, model_validator
from typing import Optional
from backend.models.budget_management_models import CategoryType

class Category_create(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    user_id: Optional[int] = None
    color: str
    type: CategoryType = CategoryType.INCOME
    budget_amount: Optional[float] = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_outcome_budget(self):
        if self.type == CategoryType.OUTCOME and self.budget_amount is None:
            raise ValueError("an outcome category requires a monthly budget")
        if self.type == CategoryType.INCOME:
            self.budget_amount = None
        return self

class Category_update(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    color: str
    type: CategoryType = CategoryType.INCOME
    budget_amount: Optional[float] = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_outcome_budget(self):
        if self.type == CategoryType.OUTCOME and self.budget_amount is None:
            raise ValueError("an outcome category requires a monthly budget")
        if self.type == CategoryType.INCOME:
            self.budget_amount = None
        return self
