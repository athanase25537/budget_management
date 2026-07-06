from fastapi import APIRouter, Depends, Response
from core.database import get_session
from services.auth.auth_services import get_user_by_id, generate_access_token
from sqlmodel import Session

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt

oauth_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "1234567"
ALGORITHM = "ES256"

router = APIRouter()

async def get_current_user(token: str = Depends(oauth_scheme), session: Session = Depends(get_session)):
    # Here you would decode the token and extract the user ID
    # For simplicity, let's assume the token is just the user ID
    payload = jwt.decode(
    token,
    SECRET_KEY,
    algorithms=[ALGORITHM]
)

    user_id = payload["sub"]
    
    user = get_user_by_id(user_id=user_id, session=session)
    
    if user["user"] is None:
        return {
            "status": "fail",
            "message": "user not found"
        }
    
    return {
        "status": "success",
        "user": user["user"]
    }


@router.post("/token")
def generate_token(form_data = Depends(OAuth2PasswordRequestForm)):
    access_token = generate_access_token({ "sub": form_data.username })
    print(access_token)
    return {
        "access_token": access_token,
        "token_type": ""
    }
