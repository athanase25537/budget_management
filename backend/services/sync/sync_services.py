from datetime import datetime, timezone

from sqlmodel import Session, select

from backend.models.budget_management_models import Category, CategoryType, Transaction
from backend.services.category.category_services import format_category
from backend.services.sync.sync_models import CategorySyncChange, TransactionSyncChange
from backend.services.transaction.transaction_models import Transaction_create, Transaction_update
from backend.services.transaction.transaction_services import format_transaction, update_solde_of_user_id, validate_transaction_category_budget


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _is_newer(client_time: datetime, server_time: datetime | None) -> bool:
    return server_time is None or _utc(client_time) > _utc(server_time)


def _category_for_change(change: CategorySyncChange, user_id: int, session: Session) -> Category | None:
    if change.remote_id is not None:
        category = session.get(Category, change.remote_id)
        return category if category and category.user_id == user_id else None
    return session.exec(select(Category).where(Category.client_id == change.client_id).where(Category.user_id == user_id)).first()


def _transaction_for_change(change: TransactionSyncChange, user_id: int, session: Session) -> Transaction | None:
    if change.remote_id is not None:
        transaction = session.get(Transaction, change.remote_id)
        return transaction if transaction and transaction.user_id == user_id else None
    return session.exec(select(Transaction).where(Transaction.client_id == change.client_id).where(Transaction.user_id == user_id)).first()


def _category_payload_is_complete(change: CategorySyncChange) -> bool:
    return change.name is not None and change.color is not None and change.type is not None and (change.type == CategoryType.INCOME or change.budget_amount is not None)


def _transaction_payload_is_complete(change: TransactionSyncChange) -> bool:
    return change.amount is not None and change.is_in is not None and change.date is not None and (change.category_remote_id is not None or change.category_client_id is not None)


def _transaction_category(change: TransactionSyncChange, user_id: int, session: Session) -> Category | None:
    if change.category_remote_id is not None:
        category = session.get(Category, change.category_remote_id)
        return category if category and category.user_id == user_id else None
    if change.category_client_id is not None:
        return session.exec(select(Category).where(Category.client_id == change.category_client_id).where(Category.user_id == user_id)).first()
    return None


def synchronize(user_id: int, categories: list[CategorySyncChange], transactions: list[TransactionSyncChange], session: Session) -> dict:
    applied: list[dict] = []
    conflicts: list[dict] = []

    for change in categories:
        existing = _category_for_change(change, user_id, session)
        if change.operation == "create":
            if existing:
                applied.append({"entity": "category", "client_id": change.client_id, "remote_id": existing.id, "operation": "already_applied"})
                continue
            if not _category_payload_is_complete(change):
                conflicts.append({"entity": "category", "client_id": change.client_id, "reason": "incomplete payload"})
                continue
            category = Category(name=change.name, color=change.color, type=change.type, budget_amount=change.budget_amount if change.type == CategoryType.OUTCOME else None, user_id=user_id, client_id=change.client_id, updated_at=_utc(change.updated_at))
            session.add(category)
            session.flush()
            applied.append({"entity": "category", "client_id": change.client_id, "remote_id": category.id, "operation": "create"})
            continue
        if not existing:
            conflicts.append({"entity": "category", "client_id": change.client_id, "reason": "not found"})
            continue
        if not _is_newer(change.updated_at, existing.updated_at):
            conflicts.append({"entity": "category", "client_id": change.client_id, "reason": "server version is newer", "remote_id": existing.id})
            continue
        if change.operation == "delete":
            has_transactions = session.exec(select(Transaction.id).where(Transaction.category_id == existing.id).where(Transaction.user_id == user_id)).first()
            if has_transactions:
                conflicts.append({"entity": "category", "client_id": change.client_id, "reason": "category has transactions", "remote_id": existing.id})
            else:
                session.delete(existing)
                applied.append({"entity": "category", "client_id": change.client_id, "remote_id": existing.id, "operation": "delete"})
            continue
        if not _category_payload_is_complete(change):
            conflicts.append({"entity": "category", "client_id": change.client_id, "reason": "incomplete payload", "remote_id": existing.id})
            continue
        existing.name, existing.color, existing.type = change.name, change.color, change.type
        existing.budget_amount = change.budget_amount if change.type == CategoryType.OUTCOME else None
        existing.updated_at = _utc(change.updated_at)
        session.add(existing)
        applied.append({"entity": "category", "client_id": change.client_id, "remote_id": existing.id, "operation": "update"})

    session.flush()
    for change in transactions:
        existing = _transaction_for_change(change, user_id, session)
        if change.operation == "create":
            if existing:
                applied.append({"entity": "transaction", "client_id": change.client_id, "remote_id": existing.id, "operation": "already_applied"})
                continue
            if not _transaction_payload_is_complete(change):
                conflicts.append({"entity": "transaction", "client_id": change.client_id, "reason": "incomplete payload"})
                continue
            category = _transaction_category(change, user_id, session)
            if not category or category.user_id != user_id or category.type != (CategoryType.INCOME if change.is_in else CategoryType.OUTCOME):
                conflicts.append({"entity": "transaction", "client_id": change.client_id, "reason": "invalid category"})
                continue
            validation_error = validate_transaction_category_budget(Transaction_create(amount=change.amount, is_in=change.is_in, user_id=user_id, date=_utc(change.date), reason=change.reason, category_id=category.id), user_id, session)
            if validation_error:
                conflicts.append({"entity": "transaction", "client_id": change.client_id, "reason": validation_error})
                continue
            transaction = Transaction(amount=change.amount, is_in=change.is_in, date=_utc(change.date), reason=change.reason, category_id=category.id, user_id=user_id, client_id=change.client_id, updated_at=_utc(change.updated_at))
            session.add(transaction)
            session.flush()
            applied.append({"entity": "transaction", "client_id": change.client_id, "remote_id": transaction.id, "operation": "create"})
            continue
        if not existing:
            conflicts.append({"entity": "transaction", "client_id": change.client_id, "reason": "not found"})
            continue
        if not _is_newer(change.updated_at, existing.updated_at):
            conflicts.append({"entity": "transaction", "client_id": change.client_id, "reason": "server version is newer", "remote_id": existing.id})
            continue
        if change.operation == "delete":
            remote_id = existing.id
            session.delete(existing)
            applied.append({"entity": "transaction", "client_id": change.client_id, "remote_id": remote_id, "operation": "delete"})
            continue
        if not _transaction_payload_is_complete(change):
            conflicts.append({"entity": "transaction", "client_id": change.client_id, "reason": "incomplete payload", "remote_id": existing.id})
            continue
        category = _transaction_category(change, user_id, session)
        if not category or category.user_id != user_id or category.type != (CategoryType.INCOME if change.is_in else CategoryType.OUTCOME):
            conflicts.append({"entity": "transaction", "client_id": change.client_id, "reason": "invalid category", "remote_id": existing.id})
            continue
        validation_error = validate_transaction_category_budget(Transaction_update(amount=change.amount, is_in=change.is_in, date=_utc(change.date), reason=change.reason, category_id=category.id), user_id, session, transaction_id_to_exclude=existing.id)
        if validation_error:
            conflicts.append({"entity": "transaction", "client_id": change.client_id, "reason": validation_error, "remote_id": existing.id})
            continue
        existing.amount, existing.is_in, existing.date, existing.reason, existing.category_id, existing.updated_at = change.amount, change.is_in, _utc(change.date), change.reason, category.id, _utc(change.updated_at)
        session.add(existing)
        applied.append({"entity": "transaction", "client_id": change.client_id, "remote_id": existing.id, "operation": "update"})

    session.commit()
    update_solde_of_user_id(user_id, session)
    categories_snapshot = session.exec(select(Category).where(Category.user_id == user_id).order_by(Category.id)).all()
    transactions_snapshot = session.exec(select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.date.desc())).all()
    return {"server_time": datetime.now(timezone.utc), "applied": applied, "conflicts": conflicts, "categories": [format_category(category, session) for category in categories_snapshot], "transactions": [format_transaction(transaction, session) for transaction in transactions_snapshot]}
