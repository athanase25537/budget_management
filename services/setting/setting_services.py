from models.budget_management_models import Setting, User
from services.setting.setting_models import SettingCreate, SettingUpdate
from sqlmodel import select, Session
import logging

logger = logging.getLogger(__name__)

def create_setting(setting_data: SettingCreate, session: Session):
    """Créer un nouveau setting pour un utilisateur"""
    
    # Vérifier si l'utilisateur existe
    user = session.exec(select(User).where(User.id == setting_data.user_id)).first()
    if not user:
        return {
            "status": "fail",
            "message": "User not found"
        }
    
    # Vérifier si l'utilisateur a déjà un setting
    existing_setting = session.exec(select(Setting).where(Setting.user_id == setting_data.user_id)).first()
    if existing_setting:
        return {
            "status": "fail",
            "message": "User already has settings"
        }
    
    # Créer le nouveau setting
    new_setting = Setting(
        economy=setting_data.economy,
        min_val_stat=setting_data.min_val_stat,
        max_val_stat=setting_data.max_val_stat,
        increment=setting_data.increment,
        user_id=setting_data.user_id
    )
    
    session.add(new_setting)
    session.commit()
    session.refresh(new_setting)
    
    logger.info(f"Settings created for user ID {setting_data.user_id}")
    
    return {
        "status": "success",
        "setting": new_setting
    }

def get_setting_by_user_id(user_id: int, session: Session):
    """Obtenir les settings d'un utilisateur par son ID"""
    
    setting = session.exec(select(Setting).where(Setting.user_id == user_id)).first()
    
    if not setting:
        return {
            "status": "fail",
            "message": "Settings not found for this user"
        }
    
    return {
        "status": "success",
        "setting": setting
    }

def get_setting_by_id(setting_id: int, session: Session):
    """Obtenir un setting par son ID"""
    
    setting = session.exec(select(Setting).where(Setting.id == setting_id)).first()
    
    if not setting:
        return {
            "status": "fail",
            "message": "Settings not found"
        }
    
    return {
        "status": "success",
        "setting": setting
    }

def update_setting(user_id: int, setting_data: SettingUpdate, session: Session):
    """Mettre à jour les settings d'un utilisateur"""
    
    setting = session.exec(select(Setting).where(Setting.user_id == user_id)).first()
    
    if not setting:
        return {
            "status": "fail",
            "message": "Settings not found for this user"
        }
    
    # Mettre à jour seulement les champs fournis
    if setting_data.economy is not None:
        setting.economy = setting_data.economy
    if setting_data.min_val_stat is not None:
        setting.min_val_stat = setting_data.min_val_stat
    if setting_data.max_val_stat is not None:
        setting.max_val_stat = setting_data.max_val_stat
    if setting_data.increment is not None:
        setting.increment = setting_data.increment
    
    session.add(setting)
    session.commit()
    session.refresh(setting)
    
    logger.info(f"Settings updated for user ID {user_id}")
    
    return {
        "status": "success",
        "setting": setting
    }

def delete_setting_by_user_id(user_id: int, session: Session):
    """Supprimer les settings d'un utilisateur"""
    
    setting = session.exec(select(Setting).where(Setting.user_id == user_id)).first()
    
    if not setting:
        return {
            "status": "fail",
            "message": "Settings not found for this user"
        }
    
    session.delete(setting)
    session.commit()
    
    logger.info(f"Settings deleted for user ID {user_id}")
    
    return {
        "status": "success",
        "message": "Settings deleted successfully"
    }

def delete_setting_by_id(setting_id: int, session: Session):
    """Supprimer un setting par son ID"""
    
    setting = session.exec(select(Setting).where(Setting.id == setting_id)).first()
    
    if not setting:
        return {
            "status": "fail",
            "message": "Settings not found"
        }
    
    session.delete(setting)
    session.commit()
    
    logger.info(f"Settings with ID {setting_id} deleted")
    
    return {
        "status": "success",
        "message": "Settings deleted successfully"
    }

def get_all_settings(session: Session):
    """Obtenir tous les settings (pour l'administration)"""
    
    settings = session.exec(select(Setting)).all()
    
    return {
        "status": "success",
        "settings": settings,
        "count": len(settings)
    }