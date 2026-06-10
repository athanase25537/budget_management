from models.budget_management_models import Category
from services.category.category_models import Category_create, Category_update
from sqlmodel import select, Session

def create_category(category: Category_create, session: Session):
    
    new_category: Category = Category(
        name=category.name,
        user_id=category.user_id
    )

    session.add(new_category)
    session.commit()
    session.refresh(new_category)

    return {
        "status": "success",
        "category": new_category
    }

def get_categories_by_user_id(user_id: int, session: Session):
    categories = session.exec(
        select(Category).where(Category.user_id == user_id)
    ).all()

    return { "categories": categories }

def get_category_by_id(category_id: int, session: Session):
    category = session.exec(
        select(Category).where(Category.id == category_id)
    ).first()

    if category == None:
        return {
            "status": "fail",
            "message": "category not found"
        }
    
    return {
        "status": "success",
        "category": category
    }

def update_category(category_id: int, category: Category_update, session: Session):
    category_to_update = get_category_by_id(category_id=category_id, session=session)

    if category_to_update == None:
        return {
            "status": "fail",
            "message": "category not found"
        }
    
    category_to_update.name = category.name

    session.add(category_to_update)
    session.commit()
    session.refresh(category_to_update)

    return {
        "status": "success",
        "category": category_to_update
    }

def del_category_by_id(category_id: int, user_id: int, session: Session):
    category_to_delete = get_category_by_id(category_id=category_id, session=session)

    if category_to_delete["category"] == None:
        return {
            "status": "fail",
            "message": "category not found"
        }
    session.delete(category_to_delete["category"])
    session.commit()


    return {
        "status": "success",
        "message": f"category with id {category_id} was deleted successfully !"
    }