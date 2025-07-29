from sqlmodel import SQLModel, Field
from datetime import datetime

class User(SQLModel, table=True):
    id: int = Field(sa_column_kwargs={"autoincrement": True})
    name: str = Field(sa_column_kwargs={"nullable": False})
    first_name: str = Field(default=None, sa_column_kwargs={"nullable": True})
    password: str = Field(sa_column_kwargs={"nullable": False})
    solde: float = Field(default=0.0)

class Transaction(SQLModel, table=True):
    id: int = Field(sa_column_kwargs={"autoincrement": True})
    amount: float = Field(sa_column_kwargs={"nullable": False})
    is_in: bool = Field(default=True)
    user_id: int = Field(foreign_key="user.id")
    date: datetime = Field(default=None)
    reason: str = Field(default=None)