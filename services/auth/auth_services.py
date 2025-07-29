from models.budget_management_models import User
from services.auth.auth_models import Auth_update_solde, Auth_update, Auth_create
from sqlmodel import select, Session
from passlib.hash import bcrypt

def create_user(user: Auth_create, session: Session):
    new_user: User = User(
        name=user.name,
        first_name=user.first_name,
        password=bcrypt.hash(user.password),
        solde=user.solde
    )

    session.add(new_user)
    session.commit()
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

def update_user(user_id: int, user: Auth_update, session: Session):
    user_to_update = get_user_by_id(user_id=user_id, session=session)

    if not user_to_update:
        return {
            "status": "fail",
            "message": "user not found"
        }
    
    user_to_update = user_to_update['user']
    user_to_update.name = user.name
    user_to_update.first_name = user.first_name
    user_to_update.password = user.password

    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)

    return {
        "status": "success",
        "user": user_to_update
    }

def update_solde(user_id, new_solde: Auth_update_solde, session: Session):
    user_to_update = get_user_by_id(user_id=user_id, session=session)
    if not user_to_update:
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