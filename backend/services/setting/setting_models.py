from pydantic import BaseModel
from typing import Optional

class SettingCreate(BaseModel):
    economy: int
    min_val_stat: int
    max_val_stat: int
    increment: int
    user_id: int

class SettingUpdate(BaseModel):
    economy: Optional[int] = None
    min_val_stat: Optional[int] = None
    max_val_stat: Optional[int] = None
    increment: Optional[int] = None

class SettingResponse(BaseModel):
    id: int
    economy: int
    min_val_stat: int
    max_val_stat: int
    increment: int
    user_id: int
    
    class Config:
        from_attributes = True