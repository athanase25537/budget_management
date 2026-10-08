from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from backend.core.database import get_session
from backend.core.errors import internal_server_error
from backend.services.auth.auth_security import get_current_user
from backend.services.setting.setting_services import (
    create_setting,
    get_setting_by_user_id,
    get_setting_by_id,
    update_setting,
    delete_setting_by_user_id,
    delete_setting_by_id,
)
from backend.services.setting.setting_models import (
    SettingCreate,
    SettingUpdate,
)

router = APIRouter()


@router.post("/create-setting")
async def create_user_setting(
    setting: SettingCreate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Créer un setting pour l'utilisateur connecté.
    """
    try:
        setting.user_id = current_user["user"].id
        return await create_setting(setting_data=setting, session=session)
    except Exception:
        raise internal_server_error("Unable to create settings") from None


@router.get("/my-setting")
def get_my_setting(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Obtenir les settings de l'utilisateur connecté.
    """
    try:
        return get_setting_by_user_id(
            user_id=current_user["user"].id,
            session=session,
        )
    except Exception:
        raise internal_server_error("Unable to retrieve settings") from None


@router.get("/setting/{setting_id}")
def get_setting_by_id_route(
    setting_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Obtenir un setting par son ID (uniquement s'il appartient à l'utilisateur).
    """
    try:
        result = get_setting_by_id(setting_id=setting_id, session=session)

        if (
            result["status"] == "success"
            and result["setting"].user_id != current_user["user"].id
        ):
            raise HTTPException(status_code=403, detail="Access denied")

        return result

    except HTTPException:
        raise
    except Exception:
        raise internal_server_error("Unable to retrieve settings") from None


@router.put("/update-my-setting")
def update_my_setting(
    setting: SettingUpdate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Mettre à jour les settings de l'utilisateur connecté.
    """
    try:
        result = update_setting(
            user_id=current_user["user"].id,
            setting_data=setting,
            session=session,
        )
        if result["status"] == "fail":
            raise HTTPException(status_code=422, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception:
        raise internal_server_error("Unable to update settings") from None


@router.delete("/delete-my-setting")
def delete_my_setting(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Supprimer les settings de l'utilisateur connecté.
    """
    try:
        return delete_setting_by_user_id(
            user_id=current_user["user"].id,
            session=session,
        )
    except Exception:
        raise internal_server_error("Unable to delete settings") from None



@router.delete("/delete-setting/{setting_id}")
def delete_setting_by_id_route(
    setting_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Supprimer un setting par son ID (uniquement s'il appartient à l'utilisateur).
    """
    try:
        result = get_setting_by_id(setting_id=setting_id, session=session)

        if (
            result["status"] == "success"
            and result["setting"].user_id != current_user["user"].id
        ):
            raise HTTPException(status_code=403, detail="Access denied")

        return delete_setting_by_id(
            setting_id=setting_id,
            session=session,
        )

    except HTTPException:
        raise
    except Exception:
        raise internal_server_error("Unable to delete settings") from None
