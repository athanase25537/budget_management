from datetime import datetime, timedelta, timezone
from decimal import Decimal

from backend.models.budget_management_models import Setting, User
from backend.services.sync.sync_models import CategorySyncChange, TransactionSyncChange
from backend.services.sync.sync_services import synchronize


def _user(session):
    user = User(username="mobile", name="Mobile", password="hash")
    session.add(user)
    session.commit()
    session.refresh(user)
    session.add(Setting(economy=0, min_val_stat=0, max_val_stat=1000000, increment=100, user_id=user.id))
    session.commit()
    return user


def test_mobile_sync_creates_related_records_and_is_idempotent(session):
    user = _user(session)
    now = datetime.now(timezone.utc)
    category = CategorySyncChange(
        client_id="11111111-1111-1111-1111-111111111111",
        operation="create",
        updated_at=now,
        name="Sakafo",
        color="#F59E0B",
        type="outcome",
        budget_amount=Decimal("100000.00"),
    )
    transaction = TransactionSyncChange(
        client_id="22222222-2222-2222-2222-222222222222",
        operation="create",
        updated_at=now,
        amount=Decimal("12000.00"),
        is_in=False,
        date=now,
        reason="Déjeuner",
        category_client_id=category.client_id,
    )

    result = synchronize(user.id, [category], [transaction], session)
    assert len(result["conflicts"]) == 0
    assert len(result["categories"]) == 1
    assert len(result["transactions"]) == 1

    retry = synchronize(user.id, [category], [transaction], session)
    assert {item["operation"] for item in retry["applied"]} == {"already_applied"}


def test_mobile_sync_rejects_an_older_update(session):
    user = _user(session)
    current = datetime.now(timezone.utc)
    create = CategorySyncChange(client_id="33333333-3333-3333-3333-333333333333", operation="create", updated_at=current, name="Transport", color="#4D96FF", type="outcome", budget_amount=Decimal("100000.00"))
    synchronize(user.id, [create], [], session)

    stale_update = CategorySyncChange(client_id=create.client_id, operation="update", updated_at=current - timedelta(seconds=1), name="Transport local", color="#4D96FF", type="outcome", budget_amount=Decimal("100000.00"))
    result = synchronize(user.id, [stale_update], [], session)
    assert result["conflicts"][0]["reason"] == "server version is newer"
