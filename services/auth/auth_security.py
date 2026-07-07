from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlmodel import Session

from core.database import get_session
from services.auth.auth_services import (
    get_user_by_id,
    login,
    generate_access_token,
)
from services.auth.auth_models import Auth_login

SECRET_KEY = "123456789abcdefghijklmnopqrstuvwxyz"
ALGORITHM = "HS256"

oauth_scheme = OAuth2PasswordBearer(tokenUrl="token")


from jose import JWTError

async def get_current_user(
    token: str = Depends(oauth_scheme),
    session: Session = Depends(get_session),
):
    try:
        print("TOKEN =", token)

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print("PAYLOAD =", payload)

        user_id = payload["sub"]

        print("USER ID =", user_id)

        user = get_user_by_id(
            user_id=user_id,
            session=session
        )

        print("USER =", user)

        return {
            "status": "success",
            "user": user["user"]
        }

    except Exception as e:
        print("JWT ERROR =", repr(e))
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