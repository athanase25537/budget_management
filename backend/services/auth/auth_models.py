from pydantic import BaseModel
from typing import Optional

class Auth_create(BaseModel):
    name: str
    first_name: str
    password: str
    solde: Optional[float]
    username: str

class Auth_update_solde(BaseModel):
    solde: float

class Auth_update(BaseModel):
    name: str
    first_name: str
    password: str
    username: str
    
class Auth_login(BaseModel):
    username: str
    password: str