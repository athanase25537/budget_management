from models.budget_management_models import User
from services.auth.auth_models import Auth_update_solde, Auth_update, Auth_create, Auth_login
from sqlmodel import select, Session
from passlib.hash import bcrypt
import logging

def create_user(user: Auth_create, session: Session):
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
    session.refresh(new_user)

    return {
        "status": "success",
        "user": new_user
    }

def get_user_by_id(user_id: int, session: Session):
    user = session.exec(
        select(User).where(User.id ==  user_id)
    ).first()
    
    print(f"user: {user}")
    return { "user": user }

def get_user_by_username(username: str, session: Session):
    user = session.exec(
        select(User).where(User.username ==  username.lower())
    ).first()
    print(f"user: {user}")
    
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
        logging.info(user)
        if user.username.lower() == identity.username and bcrypt.verify(identity.password, user.password):
            return {
                "status": "success",
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