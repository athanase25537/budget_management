from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from sqlmodel import Session

from core.database import get_session
from services.auth.auth_services import (
    get_user_by_id,
    login,
    generate_access_token,
)
from services.auth.auth_models import Auth_login
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM") 

oauth_scheme = OAuth2PasswordBearer(tokenUrl="token")



async def get_current_user(
    token: str = Depends(oauth_scheme),
    session: Session = Depends(get_session),
):
    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload["sub"]

        user = get_user_by_id(
            user_id=user_id,
            session=session
        )

        return {
            "status": "success",
            "user": user["user"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )


router = APIRouter()


@router.get("/")
def welcome():
    return {"message": "Welcome to Budget Management API !"}


@router.post("/token")
def generate_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):

    data = Auth_login(
        username=form_data.username,
        password=form_data.password
    )

    user = login(identity=data, session=session)

    if user["status"] != "success":
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = generate_access_token(
        {
            "sub": str(user["user"].id)
        }
    )

    return {
        "access_token": access_token,
        "token_type": "Bearer"
    }