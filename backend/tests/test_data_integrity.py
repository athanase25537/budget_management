from datetime import datetime
from decimal import Decimal

from sqlmodel import select

from backend.models.budget_management_models import Category, CategoryType, Setting, Transaction, User
from backend.services.auth.auth_services import del_user_by_id
from backend.services.category.category_services import del_category_by_id, get_category_monthly_spending


def _user(session, username="ada"):
    user = User(username=username, name=username.title(), password="hash")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_referenced_category_cannot_be_deleted(session):
    user = _user(session)
    category = Category(
        name="Food",
        color="#000000",
        user_id=user.id,
        type=CategoryType.OUTCOME,
        budget_amount=Decimal("10.00"),
    )
    session.add(category)
    session.commit()
    session.refresh(category)
    session.add(
        Transaction(
            amount=Decimal("1.00"),
            is_in=False,
            user_id=user.id,
            category_id=category.id,
            date=datetime.now(),
        )
    )
    session.commit()

    assert del_category_by_id(category.id, user.id, session) == {
        "status": "fail",
        "message": "category has transactions and cannot be deleted",
    }


def test_money_calculations_are_decimal_exact(session):
    user = _user(session)
    category = Category(
        name="Food",
        color="#000000",
        user_id=user.id,
        type=CategoryType.OUTCOME,
        budget_amount=Decimal("10.00"),
    )
    session.add(category)
    session.commit()
    session.refresh(category)
    session.add_all(
        [
            Transaction(amount=Decimal("0.10"), is_in=False, user_id=user.id, category_id=category.id, date=datetime.now()),
            Transaction(amount=Decimal("0.20"), is_in=False, user_id=user.id, category_id=category.id, date=datetime.now()),
        ]
    )
    session.commit()

    assert get_category_monthly_spending(category.id, user.id, session) == Decimal("0.30")


def test_deleting_user_removes_owned_records(session):
    user = _user(session)
    category = Category(
        name="Food",
        color="#000000",
        user_id=user.id,
        type=CategoryType.OUTCOME,
        budget_amount=Decimal("10.00"),
    )
    setting = Setting(economy=30, min_val_stat=100, max_val_stat=1000, increment=100, user_id=user.id)
    session.add_all([category, setting])
    session.commit()
    session.refresh(category)
    session.add(Transaction(amount=Decimal("1.00"), is_in=False, user_id=user.id, category_id=category.id, date=datetime.now()))
    session.commit()

    assert del_user_by_id(user.id, session)["status"] == "success"
    assert session.exec(select(User)).all() == []
    assert session.exec(select(Category)).all() == []
    assert session.exec(select(Setting)).all() == []
    assert session.exec(select(Transaction)).all() == []
