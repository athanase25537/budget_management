from fastapi import APIRouter, Depends, HTTPException
from services.setting.setting_services import (
    create_setting,
    get_setting_by_user_id,
    get_setting_by_id,
    update_setting,
    delete_setting_by_user_id,
    delete_setting_by_id,
    get_all_settings
)
from services.setting.setting_models import SettingCreate, SettingUpdate
from core.database import get_session
from sqlmodel import Session

router = APIRouter()

@router.get('/')
def welcome_settings():
    return { "message": "Welcome to Budget Management API: [settings] !"}

@router.post('/create-setting')
def create_user_setting(setting: SettingCreate, session: Session = Depends(get_session)):
    """
    Créer un nouveau setting pour un utilisateur
    """
    try:
        return create_setting(setting_data=setting, session=session)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating setting: {e}")

@router.get('/get-setting-by-user-id/{user_id}')
def get_setting_by_user_id_route(user_id: int, session: Session = Depends(get_session)):
    """
    Obtenir les settings d'un utilisateur par son ID
    """
    try:
        return get_setting_by_user_id(user_id=user_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error retrieving setting: {e}")

@router.get('/get-setting-by-id/{setting_id}')
def get_setting_by_id_route(setting_id: int, session: Session = Depends(get_session)):
    """
    Obtenir un setting par son ID
    """
    try:
        return get_setting_by_id(setting_id=setting_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error retrieving setting: {e}")

@router.put('/update-setting-by-user-id/{user_id}')
def update_setting_by_user_id_route(user_id: int, setting: SettingUpdate, session: Session = Depends(get_session)):
    """
    Mettre à jour les settings d'un utilisateur
    """
    try:
        return update_setting(user_id=user_id, setting_data=setting, session=session)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating setting: {e}")

@router.delete('/delete-setting-by-user-id/{user_id}')
def delete_setting_by_user_id_route(user_id: int, session: Session = Depends(get_session)):
    """
    Supprimer les settings d'un utilisateur par son ID
    """
    try:
        return delete_setting_by_user_id(user_id=user_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting setting: {e}")

@router.delete('/delete-setting-by-id/{setting_id}')
def delete_setting_by_id_route(setting_id: int, session: Session = Depends(get_session)):
    """
    Supprimer un setting par son ID
    """
    try:
        return delete_setting_by_id(setting_id=setting_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting setting: {e}")

@router.get('/get-all-settings')
def get_all_settings_route(session: Session = Depends(get_session)):
    """
    Obtenir tous les settings (pour administration)
    """
    try:
        return get_all_settings(session=session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving all settings: {e}")