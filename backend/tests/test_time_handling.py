from datetime import datetime, timedelta, timezone

from backend.models.budget_management_models import Category, CategoryType
from backend.services.transaction.transaction_models import Transaction_create


def test_transaction_dates_are_normalized_to_utc():
    naive = Transaction_create(
        amount="1.00",
        is_in=True,
        user_id=1,
        category_id=1,
        date=datetime(2026, 10, 8, 12, 0),
    )
    offset = Transaction_create(
        amount="1.00",
        is_in=True,
        user_id=1,
        category_id=1,
        date=datetime(2026, 10, 8, 15, 0, tzinfo=timezone(timedelta(hours=3))),
    )

    assert naive.date.tzinfo == timezone.utc
    assert offset.date == datetime(2026, 10, 8, 12, 0, tzinfo=timezone.utc)


def test_category_creation_timestamp_is_utc_aware():
    category = Category(name="Food", color="#000000", type=CategoryType.OUTCOME, budget_amount="10.00")

    assert category.created_at.tzinfo == timezone.utc
