from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from core.database import get_session
from services.auth.auth_security import get_current_user
from services.setting.setting_services import (
    create_setting,
    get_setting_by_user_id,
    get_setting_by_id,
    update_setting,
    delete_setting_by_user_id,
    delete_setting_by_id,
    get_all_settings,
)
from services.setting.setting_models import (
    SettingCreate,
    SettingUpdate,
)

router = APIRouter()


@router.post("/create-setting")
def create_user_setting(
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
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating setting: {e}")


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
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error retrieving setting: {e}")


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

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error retrieving setting: {e}")


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
        return update_setting(
            user_id=current_user["user"].id,
            setting_data=setting,
            session=session,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating setting: {e}")


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
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting setting: {e}")


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

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting setting: {e}")


@router.get("/get-all-settings")
def get_all_settings_route(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Obtenir tous les settings.
    À réserver à un administrateur.
    """
    try:
        # Exemple :
        # if current_user["user"].role != "admin":
        #     raise HTTPException(status_code=403, detail="Access denied")

        return get_all_settings(session=session)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving all settings: {e}")