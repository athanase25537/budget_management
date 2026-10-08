from fastapi import APIRouter, HTTPException, Depends
from backend.core.database import get_session
from backend.services.auth.auth_services import (
    create_user,
    update_user,
    update_solde,
    del_user_by_id,
    login,
    get_user_by_id as get_u_by_id,
    get_user_by_username as get_u_by_username,
    serialize_user,
)
from sqlmodel import Session
from backend.services.auth.auth_security import get_current_user
from backend.core.errors import internal_server_error
from backend.services.auth.auth_models import (
    Auth_create,
    Auth_login,
    Auth_update,
    Auth_update_solde,
    AuthResponse,
    UserEnvelope,
)

router = APIRouter()


@router.post("/login", response_model=AuthResponse)
def auth_user(
    identity: Auth_login,
    session: Session = Depends(get_session),
):
    try:
        return login(identity=identity, session=session)
    except Exception:
        raise internal_server_error("Unable to authenticate user") from None


@router.post("/add-user", response_model=AuthResponse)
async def add_user(
    new_user: Auth_create,
    session: Session = Depends(get_session),
):
    try:
        return await create_user(user=new_user, session=session)
    except Exception:
        raise internal_server_error("Unable to create user") from None


@router.put("/user-update-by-id", response_model=AuthResponse)
def update_user_by_id(
    user: Auth_update,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        user_id = current_user["user"].id
        return update_user(user_id=user_id, user=user, session=session)
    except Exception:
        raise internal_server_error("Unable to update user") from None


@router.put("/user-update-solde", response_model=AuthResponse)
def update_user_solde(
    new_solde: Auth_update_solde,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        user_id = current_user["user"].id
        return update_solde(user_id=user_id, new_solde=new_solde, session=session)
    except Exception:
        raise internal_server_error("Unable to update user balance") from None


@router.delete("/delete-by-id")
def delete_user_by_id(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        user_id = current_user["user"].id
        result = del_user_by_id(user_id=user_id, session=session)
        if result["status"] == "fail":
            raise HTTPException(status_code=404, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception:
        raise internal_server_error("Unable to delete user") from None


@router.get("/id", response_model=UserEnvelope)
def get_user_by_id(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        user_id = current_user["user"].id
        result = get_u_by_id(user_id=user_id, session=session)
        if result["user"] is None:
            raise HTTPException(status_code=404, detail="user not found")
        return {"user": serialize_user(result["user"])}
    except HTTPException:
        raise
    except Exception:
        raise internal_server_error("Unable to retrieve user") from None


@router.get("/get-user-by-username", response_model=UserEnvelope)
def get_user_by_username(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        username = current_user["user"].username
        result = get_u_by_username(username=username, session=session)
        if result["user"] is None:
            raise HTTPException(status_code=404, detail="user not found")
        return {"user": serialize_user(result["user"])}
    except HTTPException:
        raise
    except Exception:
        raise internal_server_error("Unable to retrieve user") from None
