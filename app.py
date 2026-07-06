from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routes.user_routes import router as user_router
from routes.transaction_routes import router as transaction_router
from routes.setting_routes import router as setting_router
from routes.category_routes import router as category_router
from services.auth.auth_security import router as security_router
from core.database import init_db, get_session
from services.auth.auth_services import get_user_by_id, generate_access_token
from sqlmodel import Session


from typing import Annotated
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt

oauth_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "1234567"
ALGORITHM = "ES256"


app = FastAPI()

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

@app.post("/token")
def generate_token(form_data = Depends(OAuth2PasswordRequestForm)):
    access_token = generate_access_token({ "sub": form_data.username })
    print(access_token)
    return {
        "access_token": access_token,
        "token_type": ""
    }

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "https://budget-management-frontend-pchq.onrender.com"
    ],  # liste de domaines spécifiques en production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Autorise toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autorise tous les headers (ex: Content-Type, Authorization)
)

@app.on_event("startup")
def on_startup():
    init_db()
    
app.include_router(router=security_router, prefix="/er", tags=["Security Routes"])
app.include_router(router=user_router, prefix="/user", tags=["User Routes"])
app.include_router(router=transaction_router, prefix="/transaction", tags=["Transaction Routes"])
app.include_router(setting_router, prefix="/setting", tags=["Setting"])
app.include_router(category_router, prefix="/category", tags=["Category Routes"])