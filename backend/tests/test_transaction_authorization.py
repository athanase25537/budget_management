from datetime import datetime
from decimal import Decimal

from backend.models.budget_management_models import Category, CategoryType, Transaction, User
from backend.services.transaction.transaction_models import Transaction_update
from backend.services.transaction.transaction_services import update_transaction


def test_user_cannot_update_another_users_transaction(session):
    owner = User(username="owner", name="Owner", password="hash")
    attacker = User(username="attacker", name="Attacker", password="hash")
    session.add_all([owner, attacker])
    session.commit()
    session.refresh(owner)
    session.refresh(attacker)

    category = Category(
        name="Income",
        color="#000000",
        user_id=attacker.id,
        type=CategoryType.INCOME,
    )
    transaction = Transaction(
        amount=Decimal("10.00"),
        is_in=True,
        user_id=owner.id,
        date=datetime.now(),
    )
    session.add_all([category, transaction])
    session.commit()
    session.refresh(category)
    session.refresh(transaction)

    result = update_transaction(
        transaction_id=transaction.id,
        transaction=Transaction_update(
            amount=Decimal("20.00"),
            is_in=True,
            category_id=category.id,
            date=datetime.now(),
        ),
        user_id=attacker.id,
        session=session,
    )

    assert result == {"status": "fail", "message": "access denied"}
    session.refresh(transaction)
    assert transaction.amount == Decimal("10.00")
