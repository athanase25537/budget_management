from fastapi import APIRouter, HTTPException, Depends
from core.database import init_db, get_session
from services.auth.auth_services import create_user, update_user, update_solde, del_user_by_id, login
from sqlmodel import Session
from services.auth.auth_models import Auth_create, Auth_login, Auth_update, Auth_update_solde

router = APIRouter()

@router.get('/')
def welcome():
    return { "message": "Welcome to Budget Management API !"}

@router.post("/login")
def auth_user(identity: Auth_login, session: Session = Depends(get_session)):
    try:
        return login(identity=Auth_login, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")
    
@router.post("/add-user")
def add_user(new_user: Auth_create, session: Session = Depends(get_session)):
    try:
        return create_user(user=new_user, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")
    
@router.put("/user-update-by-id/{user_id}")
def update_user_by_id(user_id: int, user: Auth_update, session: Session = Depends(get_session)):
    try:
        return update_user(user_id=user_id, user=user, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")
    
@router.put("/user-update-solde/{user_id}")
def update_user_solde(user_id: int, new_solde: Auth_update_solde, session: Session = Depends(get_session)):
    try:
        return update_solde(user_id=user_id, new_solde=new_solde, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")

@router.delete("/delete-user-by-id/{user_id}")
def delete_user_by_id(user_id: int, session: Session = Depends(get_session)):
    try:
        return del_user_by_id(user_id=user_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")