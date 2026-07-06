from fastapi import APIRouter, HTTPException, Depends
from core.database import get_session
from services.auth.auth_services import (
    create_user,
    update_user,
    update_solde,
    del_user_by_id,
    login,
    get_user_by_id as get_u_by_id,
    get_user_by_username as get_u_by_username,
)
from sqlmodel import Session
from services.auth.auth_security import get_current_user
from services.auth.auth_models import (
    Auth_create,
    Auth_login,
    Auth_update,
    Auth_update_solde,
)

router = APIRouter()


@router.post("/login")
def auth_user(
    identity: Auth_login,
    session: Session = Depends(get_session),
):
    try:
        return login(identity=identity, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.post("/add-user")
async def add_user(
    new_user: Auth_create,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return await create_user(user=new_user, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.put("/user-update-by-id/{user_id}")
def update_user_by_id(
    user_id: int,
    user: Auth_update,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return update_user(user_id=user_id, user=user, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.put("/user-update-solde/{user_id}")
def update_user_solde(
    user_id: int,
    new_solde: Auth_update_solde,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return update_solde(user_id=user_id, new_solde=new_solde, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.delete("/delete-user-by-id/{user_id}")
def delete_user_by_id(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return del_user_by_id(user_id=user_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.get("/get-user-by-id")
def get_user_by_id(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return get_u_by_id(user_id=user_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")


@router.get("/get-user-by-username")
def get_user_by_username(
    username: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return get_u_by_username(username=username, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")