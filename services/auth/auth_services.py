from models.budget_management_models import User
from services.auth.auth_models import Auth_update_solde, Auth_update, Auth_create, Auth_login
from services.category.category_services import create_category
from services.category.category_models import Category_create
from sqlmodel import select, Session
from passlib.hash import bcrypt
from jose import jwt
from ecdsa import (SigningKey, NIST256p)
from datetime import datetime, timedelta, timezone

PRIVATE_KEY = SigningKey.generate(curve=NIST256p)
PUBLIC_KEY = PRIVATE_KEY.get_verifying_key()

private_key_pem = PRIVATE_KEY.to_pem()
public_key_pem = PUBLIC_KEY.to_pem()

ALGORITHM = "ES256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
VERIFICATION_CODE_EXPIRE_HOURS = 24
PASSWORD_LENGTH = 6

def generate_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        private_key_pem,
        algorithm=ALGORITHM
    )
    return encoded_jwt

async def create_user(user: Auth_create, session: Session):
    my_user = get_user_by_username(username=user.username, session=session)
    if my_user["user"] != None:
        return {
            "status": "fail",
            "message": f"username: {user.username} already exist"
        }
    
    new_user: User = User(
        name=user.name.lower(),
        username=user.username.lower(),
        first_name=user.first_name.lower(),
        password=bcrypt.hash(user.password),
        solde=user.solde
    )

    session.add(new_user)
    session.commit()
    
    # create default category for the user
    default_categories = [
        {"name": "food", "color": "#FF6B6B"},           # rouge
        {"name": "transport", "color": "#4D96FF"},      # bleu
        {"name": "entertainment", "color": "#9D4EDD"},  # violet
        {"name": "health", "color": "#2ECC71"},         # vert
        {"name": "education", "color": "#F39C12"},      # orange
        {"name": "other", "color": "#95A5A6"},          # gris
    ]
    for cat in default_categories:
        category = Category_create(name=cat["name"], user_id=new_user.id, color=cat["color"])
        await create_category(category=category, session=session)

    session.refresh(new_user)

    return {
        "status": "success",
        "user": new_user
    }

def get_user_by_id(user_id: int, session: Session):
    user = session.exec(
        select(User).where(User.id ==  user_id)
    ).first()
    
    return { "user": user }

def get_user_by_username(username: str, session: Session):
    user = session.exec(
        select(User).where(User.username ==  username.lower())
    ).first()
    
    return { "user": user }

def update_user(user_id: int, user: Auth_update, session: Session):
    user_to_update = get_user_by_id(user_id=user_id, session=session)

    if user_to_update == None:
        return {
            "status": "fail",
            "message": "user not found"
        }
    
    user_to_update = user_to_update['user']
    user_to_update.name = user.name.lower()
    user_to_update.first_name = user.first_name.lower()
    user_to_update.username = user.username.lower()
    user_to_update.password = bcrypt.hash(user.password)

    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)

    return {
        "status": "success",
        "user": user_to_update
    }

def update_solde(user_id, new_solde: Auth_update_solde, session: Session):
    user_to_update = get_user_by_id(user_id=user_id, session=session)
    if user_to_update == None:
        return {
            "status": "fail",
            "message": "user not found"
        }
    user_to_update = user_to_update['user']
    user_to_update.solde = new_solde.solde

    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)

    return {
        "status": "success",
        "user": user_to_update
    }

def login(identity: Auth_login, session: Session):
    users = session.exec(select(User)).all()
    for user in users:
        if user.username.lower() == identity.username.lower() and bcrypt.verify(identity.password, user.password):
            
            return {
                "status": "success",
                "access_token": generate_access_token({ "sub": user.username }),
                "token_type": "Bearer",
                "user": user
            }
    
    return {
        "status": "fail"
    }

def del_user_by_id(user_id: int, session: Session):
    user_to_delete = get_user_by_id(user_id=user_id, session=session)
    if user_to_delete == None:
        return {
            "status": "fail",
            "message": "user not found"
        }
    session.delete(user_to_delete['user'])
    session.commit()

    return {
        "status": "success",
        "message": f"user with id {user_id} was deleted successfully !"
    }