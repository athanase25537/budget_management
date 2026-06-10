from fastapi import APIRouter, Depends, HTTPException
from services.category.category_services import(
    create_category as c_category,
    get_categories_by_user_id as g_categories_by_user_id,
    get_category_by_id as g_category_by_id,
    update_category as u_category,
    del_category_by_id as d_category_by_id
)

from services.transaction.transaction_models import Transaction_create, Transaction_update
from core.database import get_session
from sqlmodel import Session

router = APIRouter()

@router.get('/')
def welcome():
    return { "message": "Welcome to Budget Management API: [transaction] !"}


@router.post('/create-category')
def create_category(category: Transaction_create, session: Session = Depends(get_session)):
    try:
        return c_category(category=category, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")
    
@router.put('/update-category-by-category-id/{category_id}')
def update_category_by_category_id(category_id: int, category: Transaction_update, session: Session = Depends(get_session)):
    try:
        return u_category(category_id=category_id, category=category, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")
    
@router.delete("/delete-category-by-category-id/{category_id}")
def delete_category_by_category_id(category_id: int, user_id: int, session: Session = Depends(get_session)):
    try:
        return d_category_by_id(category_id=category_id, user_id=user_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}") 
    
@router.get("/get-category-by-id")
def get_category_by_id(category_id: int, session: Session = Depends(get_session)):
    try:
        return g_category_by_id(category_id=category_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}") 
    
@router.get("/get-categories-by-user-id")
def get_categories_by_user_id(user_id: int, session: Session = Depends(get_session)):
    try:
        return g_categories_by_user_id(user_id=user_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}") 