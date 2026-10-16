import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from jose import jwt
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from backend.core.config import ALGORITHM, SECRET_KEY
from backend.models.budget_management_models import Category, CategoryType, Setting, User
from backend.services.auth.auth_models import Auth_create, Auth_login, Auth_update, Auth_update_solde

ACCESS_TOKEN_EXPIRE_MINUTES = 24*60
DEFAULT_OUTCOME_CATEGORY_BUDGET = Decimal("100000.00")
PASSWORD_HASH_ALGORITHM = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 600_000
PASSWORD_SALT_BYTES = 16


def hash_password(password: str) -> str:
    """Hash a password without native extensions, including on Pyodide."""
    salt = secrets.token_bytes(PASSWORD_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_HASH_ITERATIONS
    )
    return "$".join(
        (
            PASSWORD_HASH_ALGORITHM,
            str(PASSWORD_HASH_ITERATIONS),
            salt.hex(),
            digest.hex(),
        )
    )


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a PBKDF2 hash using a timing-safe comparison."""
    try:
        algorithm, iterations, salt_hex, expected_digest = password_hash.split("$", 3)
        if algorithm != PASSWORD_HASH_ALGORITHM:
            return False

        salt = bytes.fromhex(salt_hex)
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt, int(iterations)
        ).hex()
        return hmac.compare_digest(digest, expected_digest)
    except (TypeError, ValueError):
        return False


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "first_name": user.first_name,
        "username": user.username,
        "solde": user.solde,
    }


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
        password=hash_password(user.password),
        solde=user.solde if user.solde is not None else Decimal("0.00"),
    )

    session.add(new_user)
    try:
        session.flush()
    except IntegrityError:
        session.rollback()
        return {
            "status": "fail",
            "message": f"username: {user.username} already exists",
        }

    setting = Setting(
        economy=30,
        min_val_stat=100,
        max_val_stat=100000,
        increment=1000,
        user_id=new_user.id,
    )
    session.add(setting)

    default_categories = [
        # Dépenses
        {"name": "Food", "color": "#FF6B6B", "type": CategoryType.OUTCOME, "budget_amount": DEFAULT_OUTCOME_CATEGORY_BUDGET},
        {"name": "Transport", "color": "#4D96FF", "type": CategoryType.OUTCOME, "budget_amount": DEFAULT_OUTCOME_CATEGORY_BUDGET},
        {"name": "Housing", "color": "#8E44AD", "type": CategoryType.OUTCOME, "budget_amount": DEFAULT_OUTCOME_CATEGORY_BUDGET},
        {"name": "Health", "color": "#2ECC71", "type": CategoryType.OUTCOME, "budget_amount": DEFAULT_OUTCOME_CATEGORY_BUDGET},
        {"name": "Education", "color": "#F39C12", "type": CategoryType.OUTCOME, "budget_amount": DEFAULT_OUTCOME_CATEGORY_BUDGET},
        {"name": "Entertainment", "color": "#E91E63", "type": CategoryType.OUTCOME, "budget_amount": DEFAULT_OUTCOME_CATEGORY_BUDGET},
        {"name": "Shopping", "color": "#1ABC9C", "type": CategoryType.OUTCOME, "budget_amount": DEFAULT_OUTCOME_CATEGORY_BUDGET},
        {"name": "Other Expense", "color": "#95A5A6", "type": CategoryType.OUTCOME, "budget_amount": DEFAULT_OUTCOME_CATEGORY_BUDGET},

        # Revenus
        {"name": "Salary", "color": "#27AE60", "type": CategoryType.INCOME},
        {"name": "Freelance", "color": "#16A085", "type": CategoryType.INCOME},
        {"name": "Investment", "color": "#2980B9", "type": CategoryType.INCOME},
        {"name": "Gift", "color": "#D35400", "type": CategoryType.INCOME},
        {"name": "Other Income", "color": "#7F8C8D", "type": CategoryType.INCOME},
    ]

    for cat in default_categories:
        category = Category(
            name=cat["name"],
            user_id=new_user.id,
            color=cat["color"],
            type=cat["type"],
            budget_amount=cat.get("budget_amount"),
        )
        session.add(category)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return {
            "status": "fail",
            "message": f"username: {user.username} already exists",
        }

    session.refresh(new_user)

    return {
        "status": "success",
        "user": serialize_user(new_user),
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

    if user_to_update["user"] is None:
        return {
            "status": "fail",
            "message": "user not found"
        }
    
    user_to_update = user_to_update['user']
    user_to_update.name = user.name.lower()
    user_to_update.first_name = user.first_name.lower()
    user_to_update.username = user.username.lower()
    if user.password is not None:
        user_to_update.password = hash_password(user.password)

    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)

    return {
        "status": "success",
        "user": serialize_user(user_to_update),
    }

def update_solde(user_id, new_solde: Auth_update_solde, session: Session):
    user_to_update = get_user_by_id(user_id=user_id, session=session)
    if user_to_update["user"] is None:
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
        "user": serialize_user(user_to_update),
    }

def login(identity: Auth_login, session: Session):
    user = get_user_by_username(username=identity.username, session=session)["user"]
    try:
        password_matches = user is not None and verify_password(identity.password, user.password)
    except (TypeError, ValueError):
        password_matches = False

    if password_matches:
        return {
            "status": "success",
            "access_token": generate_access_token({ "sub": str(user.id) }),
            "token_type": "Bearer",
            "user": serialize_user(user),
        }
    
    return {
        "status": "fail"
    }

def del_user_by_id(user_id: int, session: Session):
    user_to_delete = get_user_by_id(user_id=user_id, session=session)
    if user_to_delete["user"] is None:
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
