# from __future__ import annotations  # <- À COMMENTER ou SUPPRIMER (crucial !)
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy.orm import Mapped, relationship as sa_relationship
from datetime import datetime

class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    username: str = Field(unique=True, nullable=False)
    name: str = Field(nullable=False)
    first_name: Optional[str] = Field(default=None)
    password: str = Field(nullable=False)
    solde: float = Field(default=0.0)

    # 1. Utiliser Mapped avec le type list/List
    # 2. Appeler Relationship avec le paramètre 'sa_relationship'
    transactions: Mapped[List["Transaction"]] = Relationship(
        sa_relationship=sa_relationship(
            back_populates="user",
            cascade="all, delete-orphan"
        )
    )
    setting: Mapped[Optional["Setting"]] = Relationship(
        sa_relationship=sa_relationship(
            back_populates="user",
            cascade="all, delete-orphan"
        )
    )

class Category(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str = Field(unique=True, nullable=False)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    transactions: Mapped[List["Transaction"]] = Relationship(
        sa_relationship=sa_relationship(back_populates="category")
    )

class Transaction(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    amount: float = Field(nullable=False)
    is_in: bool = Field(default=True)

    user_id: int = Field(foreign_key="user.id")
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")

    date: Optional[datetime] = Field(default=None)
    reason: Optional[str] = Field(default=None)

    user: Mapped[Optional["User"]] = Relationship(
        sa_relationship=sa_relationship(back_populates="transactions")
    )
    category: Mapped[Optional["Category"]] = Relationship(
        sa_relationship=sa_relationship(back_populates="transactions")
    )

class Setting(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    economy: int = Field(nullable=False)

    min_val_stat: int = Field(default=0)
    max_val_stat: Optional[int] = Field(default=None)
    increment: Optional[int] = Field(default=None)

    user_id: int = Field(foreign_key="user.id", unique=True)

    user: Mapped[Optional["User"]] = Relationship(
        sa_relationship=sa_relationship(back_populates="setting")
    )