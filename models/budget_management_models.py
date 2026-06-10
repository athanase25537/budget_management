from __future__ import annotations

from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import List, Optional


class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    username: str = Field(unique=True, nullable=False)
    name: str = Field(nullable=False)
    first_name: Optional[str] = Field(default=None)
    password: str = Field(nullable=False)
    solde: float = Field(default=0.0)

    transactions: List["Transaction"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

    setting: Optional["Setting"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class Category(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str = Field(unique=True, nullable=False)
    user_id: int = Field(foreign_key="user.id")
    transactions: List["Transaction"] = Relationship(
        back_populates="category"
    )


class Transaction(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    amount: float = Field(nullable=False)
    is_in: bool = Field(default=True)

    user_id: int = Field(foreign_key="user.id")
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")

    date: Optional[datetime] = Field(default=None)
    reason: Optional[str] = Field(default=None)

    user: Optional["User"] = Relationship(back_populates="transactions")
    category: Optional["Category"] = Relationship(back_populates="transactions")


class Setting(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    economy: int = Field(nullable=False)

    min_val_stat: int = Field(default=0)
    max_val_stat: Optional[int] = Field(default=None)
    increment: Optional[int] = Field(default=None)

    user_id: int = Field(foreign_key="user.id", unique=True)

    user: Optional["User"] = Relationship(back_populates="setting")