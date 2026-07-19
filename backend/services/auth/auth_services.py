from backend.models.budget_management_models import User
from backend.services.auth.auth_models import Auth_update_solde, Auth_update, Auth_create, Auth_login
from backend.services.category.category_services import create_category
from backend.services.category.category_models import Category_create
from backend.services.setting.setting_services import create_setting
from backend.services.setting.setting_models import SettingCreate
from sqlmodel import select, Session
from passlib.hash import bcrypt
from jose import jwt
from backend.models.budget_management_models import CategoryType
from datetime import datetime, timedelta, timezone
from jose import jwt

from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")  # Default to HS256 if not set

ACCESS_TOKEN_EXPIRE_MINUTES = 24*60


def generate_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
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
    

    # create default setting for the user
    setting = SettingCreate(
        economy=30,
        min_val_stat=100,
        max_val_stat=100000,
        increment=1000,
        user_id=new_user.id
    )
    await create_setting(setting_data=setting, session=session)

    # create default category for the user
    default_categories = [
    # Dépenses
    {"name": "Food", "color": "#FF6B6B", "type": CategoryType.OUTCOME},
    {"name": "Transport", "color": "#4D96FF", "type": CategoryType.OUTCOME},
    {"name": "Housing", "color": "#8E44AD", "type": CategoryType.OUTCOME},
    {"name": "Health", "color": "#2ECC71", "type": CategoryType.OUTCOME},
    {"name": "Education", "color": "#F39C12", "type": CategoryType.OUTCOME},
    {"name": "Entertainment", "color": "#E91E63", "type": CategoryType.OUTCOME},
    {"name": "Shopping", "color": "#1ABC9C", "type": CategoryType.OUTCOME},
    {"name": "Other Expense", "color": "#95A5A6", "type": CategoryType.OUTCOME},

    # Revenus
    {"name": "Salary", "color": "#27AE60", "type": CategoryType.INCOME},
    {"name": "Freelance", "color": "#16A085", "type": CategoryType.INCOME},
    {"name": "Investment", "color": "#2980B9", "type": CategoryType.INCOME},
    {"name": "Gift", "color": "#D35400", "type": CategoryType.INCOME},
    {"name": "Other Income", "color": "#7F8C8D", "type": CategoryType.INCOME},
]

    for cat in default_categories:
        category = Category_create(
            name=cat["name"],
            user_id=new_user.id,
            color=cat["color"],
            type=cat["type"],
        )
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
                "access_token": generate_access_token({ "sub": str(user.id) }),
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