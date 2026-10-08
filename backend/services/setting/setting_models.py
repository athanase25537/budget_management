from pydantic import BaseModel, Field, model_validator
from typing import Optional

class SettingCreate(BaseModel):
    economy: int = Field(ge=0, le=100)
    min_val_stat: int = Field(ge=0)
    max_val_stat: int = Field(ge=0)
    increment: int = Field(gt=0)
    user_id: int

    @model_validator(mode="after")
    def validate_range(self):
        if self.min_val_stat > self.max_val_stat:
            raise ValueError("min_val_stat must be less than or equal to max_val_stat")
        return self

class SettingUpdate(BaseModel):
    economy: Optional[int] = Field(default=None, ge=0, le=100)
    min_val_stat: Optional[int] = Field(default=None, ge=0)
    max_val_stat: Optional[int] = Field(default=None, ge=0)
    increment: Optional[int] = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_range(self):
        if (
            self.min_val_stat is not None
            and self.max_val_stat is not None
            and self.min_val_stat > self.max_val_stat
        ):
            raise ValueError("min_val_stat must be less than or equal to max_val_stat")
        return self

class SettingResponse(BaseModel):
    id: int
    economy: int
    min_val_stat: int
    max_val_stat: int
    increment: int
    user_id: int
    
    class Config:
        from_attributes = True
