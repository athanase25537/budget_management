from backend.models.budget_management_models import Category, CategoryType, Transaction
from backend.services.category.category_models import Category_create, Category_update
from sqlmodel import select, Session, func
from sqlalchemy import desc
from datetime import datetime


def _month_bounds(reference_date: datetime | None = None):
    reference_date = reference_date or datetime.now()
    start_date = reference_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if reference_date.month == 12:
        end_date = reference_date.replace(
            year=reference_date.year + 1,
            month=1,
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )
    else:
        end_date = reference_date.replace(
            month=reference_date.month + 1,
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )
    return start_date, end_date


def get_category_monthly_spending(
    category_id: int,
    user_id: int,
    session: Session,
    reference_date: datetime | None = None,
    exclude_transaction_id: int | None = None,
) -> float:
    start_date, end_date = _month_bounds(reference_date)
    query = (
        select(func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(Transaction.category_id == category_id)
        .where(Transaction.user_id == user_id)
        .where(Transaction.is_in == False)
        .where(Transaction.date >= start_date)
        .where(Transaction.date < end_date)
    )
    if exclude_transaction_id is not None:
        query = query.where(Transaction.id != exclude_transaction_id)
    return float(session.exec(query).one() or 0.0)


def format_category(category: Category, session: Session):
    spent_amount = get_category_monthly_spending(
        category_id=category.id,
        user_id=category.user_id,
        session=session,
    ) if category.type == CategoryType.OUTCOME else 0.0
    budget_amount = category.budget_amount if category.type == CategoryType.OUTCOME else None

    return {
        "id": category.id,
        "name": category.name,
        "color": category.color,
        "user_id": category.user_id,
        "type": category.type,
        "budget_amount": budget_amount,
        "spent_amount": spent_amount,
        "remaining_amount": max((budget_amount or 0.0) - spent_amount, 0.0) if budget_amount is not None else None,
        "created_at": category.created_at,
    }


def get_category_summary(user_id: int, session: Session):
    start_date, end_date = _month_bounds()
    total_categories = session.exec(
        select(func.count(Category.id)).where(Category.user_id == user_id)
    ).one()
    created_this_month = session.exec(
        select(func.count(Category.id))
        .where(Category.user_id == user_id)
        .where(Category.created_at >= start_date)
        .where(Category.created_at < end_date)
    ).one()
    most_used_row = session.exec(
        select(Category, func.count(Transaction.id).label("transaction_count"))
        .join(Transaction, Transaction.category_id == Category.id)
        .where(Category.user_id == user_id)
        .where(Transaction.user_id == user_id)
        .where(Transaction.date >= start_date)
        .where(Transaction.date < end_date)
        .group_by(Category.id)
        .order_by(desc("transaction_count"), Category.name.asc())
    ).first()

    most_used = None
    if most_used_row:
        category, transaction_count = most_used_row
        most_used = {
            "id": category.id,
            "name": category.name,
            "color": category.color,
            "transaction_count": transaction_count,
        }

    return {
        "total_categories": total_categories,
        "created_this_month": created_this_month,
        "most_used": most_used,
    }

async def create_category(category: Category_create, session: Session):
    
    new_category: Category = Category(
        name=category.name,
        user_id=category.user_id,
        color=category.color,
        type=category.type,
        budget_amount=category.budget_amount,
    )

    session.add(new_category)
    session.commit()
    session.refresh(new_category)

    return {
        "status": "success",
        "category": format_category(new_category, session)
    }

def get_categories_by_user_id(user_id: int, session: Session, page: int = 1, items_per_page: int = 20):
    categories = session.exec(
        select(Category)
        .where(Category.user_id == user_id)
        .order_by(Category.id.desc())
        .offset((page - 1) * items_per_page)
        .limit(items_per_page)
    ).all()
    
    categories_count = session.exec(
        select(func.count(Category.id))
        .where(Category.user_id == user_id)
    ).one()
    
    categories_left = categories_count - (page * items_per_page)

    return {
        "categories": [format_category(category, session) for category in categories],
        "has_next_page": categories_left > 0,
        "has_previous_page": page > 1,
        "current_page": page,
        "element_per_page": items_per_page,
        "total": categories_count,
        "summary": get_category_summary(user_id=user_id, session=session),
    }

def get_all_categories_by_user_id(user_id: int, session: Session):
    categories = session.exec(
        select(Category)
        .where(Category.user_id == user_id)
        .order_by(Category.id.asc())
    ).all()

    return {"categories": [format_category(category, session) for category in categories]}

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
    response = get_category_by_id(category_id=category_id, session=session)

    if response['status'] == 'fail':
        return {
            "status": "fail",
            "message": "category not found"
        }
        
    category_to_update = response['category']
    category_to_update.name = category.name
    category_to_update.color = category.color
    category_to_update.type = category.type
    category_to_update.budget_amount = category.budget_amount

    session.add(category_to_update)
    session.commit()
    session.refresh(category_to_update)

    return {
        "status": "success",
        "category": format_category(category_to_update, session)
    }

def del_category_by_id(category_id: int, user_id: int, session: Session):
    category_to_delete = get_category_by_id(category_id=category_id, session=session)

    if category_to_delete["status"] == "fail" or category_to_delete["category"] is None:
        return {
            "status": "fail",
            "message": "category not found"
        }
    if category_to_delete["category"].user_id != user_id:
        return {
            "status": "fail",
            "message": "access denied",
        }
    session.delete(category_to_delete["category"])
    session.commit()


    return {
        "status": "success",
        "message": f"category with id {category_id} was deleted successfully !"
    }
