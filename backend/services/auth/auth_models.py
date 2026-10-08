from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal


class UserPublic(BaseModel):
    id: int
    name: str
    first_name: Optional[str]
    username: str
    solde: Decimal


class UserEnvelope(BaseModel):
    user: UserPublic


class AuthResponse(BaseModel):
    status: str
    user: Optional[UserPublic] = None
    message: Optional[str] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = None

class Auth_create(BaseModel):
    name: str
    first_name: str
    password: str
    solde: Optional[Decimal]
    username: str

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("password must not exceed 72 bytes")
        return password

class Auth_update_solde(BaseModel):
    solde: Decimal

class Auth_update(BaseModel):
    name: str
    first_name: str
    password: Optional[str] = None
    username: str

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, password: Optional[str]) -> Optional[str]:
        if password is None:
            return password
        if len(password.encode("utf-8")) > 72:
            raise ValueError("password must not exceed 72 bytes")
        return password
    
class Auth_login(BaseModel):
    username: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("password must not exceed 72 bytes")
        return password
