from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from core.database import get_session
from services.auth.auth_security import get_current_user
from services.category.category_services import (
    create_category as c_category,
    get_categories_by_user_id as g_categories_by_user_id,
    get_category_by_id as g_category_by_id,
    get_all_categories_by_user_id as g_all_categories_by_user_id,
    update_category as u_category,
    del_category_by_id as d_category_by_id,
)
from services.category.category_models import (
    Category_create,
    Category_update,
)

router = APIRouter()


@router.post("/create-category")
async def create_category(
    category: Category_create,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        category.user_id = current_user["user"].id
        return await c_category(category=category, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.put("/update-category/{category_id}")
def update_category_by_category_id(
    category_id: int,
    category: Category_update,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return u_category(
            category_id=category_id,
            category=category,
            session=session,
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.delete("/delete-category/{category_id}")
def delete_category_by_category_id(
    category_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return d_category_by_id(
            category_id=category_id,
            user_id=current_user["user"].id,
            session=session,
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.get("/category/{category_id}")
def get_category_by_id(
    category_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        result = g_category_by_id(
            category_id=category_id,
            session=session,
        )

        if (
            result["status"] == "success"
            and result["category"].user_id != current_user["user"].id
        ):
            raise HTTPException(status_code=403, detail="Access denied")

        return result

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.get("/categories")
def get_categories_by_user_id(
    page: int = 1,
    items_per_page: int = 10,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return g_categories_by_user_id(
            user_id=current_user["user"].id,
            session=session,
            page=page,
            items_per_page=items_per_page,
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.get("/all-categories")
def get_all_categories_by_user_id(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return g_all_categories_by_user_id(
            user_id=current_user["user"].id,
            session=session,
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")