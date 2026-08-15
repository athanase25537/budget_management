from backend.models.budget_management_models import Transaction, Setting, CategoryType
from backend.services.transaction.transaction_models import Transaction_create, Transaction_update
from backend.services.category.category_services import (
    get_category_by_id,
    get_category_monthly_spending,
)
from sqlmodel import select, Session
from sqlalchemy import func, desc
from datetime import datetime


def validate_transaction_category_budget(
    transaction: Transaction_create | Transaction_update,
    user_id: int,
    session: Session,
    transaction_id_to_exclude: int | None = None,
):
    category_response = get_category_by_id(category_id=transaction.category_id, session=session)
    if category_response["status"] == "fail":
        return "Category not found."

    category = category_response["category"]
    if category.user_id != user_id:
        return "The selected category does not belong to the current user."

    expected_type = CategoryType.INCOME if transaction.is_in else CategoryType.OUTCOME
    if category.type != expected_type:
        return "The selected category does not match the transaction type."

    if not transaction.is_in:
        if category.budget_amount is None:
            return f'No monthly budget is configured for the category "{category.name}".'
        spent_amount = get_category_monthly_spending(
            category_id=category.id,
            user_id=user_id,
            session=session,
            reference_date=transaction.date,
            exclude_transaction_id=transaction_id_to_exclude,
        )
        remaining_amount = category.budget_amount - spent_amount
        if transaction.amount > remaining_amount + 0.000001:
            return (
                f'Insufficient budget for "{category.name}": '
                f'{max(remaining_amount, 0):.2f} MGA remaining out of {category.budget_amount:.2f} MGA.'
            )
    return None

def create_transaction(transaction: Transaction_create, session: Session):

    validation_error = validate_transaction_category_budget(
        transaction=transaction,
        user_id=transaction.user_id,
        session=session,
    )
    if validation_error:
        return {
            "status": "fail",
            "message": validation_error,
        }

    new_transaction: Transaction = Transaction(
        amount=transaction.amount,
        is_in=transaction.is_in,
        user_id=transaction.user_id,
        date=transaction.date,
        reason=transaction.reason,
        category_id=transaction.category_id
    )
    

    session.add(new_transaction)
    session.commit()
    session.refresh(new_transaction)

    # update user
    update_solde_of_user_id(user_id=transaction.user_id, session=session)

    return {
        "status": "success",
        "transaction": format_transaction(new_transaction, session)
    }

def get_transaction_by_id(transaction_id: int, session: Session):
    transaction = session.exec(
        select(Transaction).where(Transaction.id ==  transaction_id)
    ).first()
    
    return { "transaction": transaction }

def get_transaction_by_user_id(
    user_id: int,
    session: Session,
    page: int = 1,
    items_per_page: int = 20,
    is_in: bool = False,
    is_out: bool = False,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    # Valeurs par défaut : toutes les transactions du mois courant.
    now = datetime.now()

    if start_date is None:
        start_date = now.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

    if end_date is None:
        end_date = now

    query = (
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .where(Transaction.date >= start_date)
        .where(Transaction.date <= end_date)
    )

    # Aucun type (ou les deux) correspond au filtre "all".
    if is_in and not is_out:
        query = query.where(Transaction.is_in == True)
    elif is_out and not is_in:
        query = query.where(Transaction.is_in == False)

    transactions = session.exec(
        query
        .order_by(desc(Transaction.date))
        .offset((page - 1) * items_per_page)
        .limit(items_per_page)
    ).all()

    transactions = format_transacions(
        transactions=transactions,
        session=session
    )

    transaction_count = session.exec(
        query.with_only_columns(func.count(Transaction.id)).order_by(None)
    ).one()

    transaction_left = transaction_count - (page * items_per_page)

    return {
        "transactions": transactions,
        "has_next_page": transaction_left > 0,
        "has_previous_page": page > 1,
        "current_page": page,
        "element_per_page": items_per_page,
        "total": transaction_count,
        "start_date": start_date,
        "end_date": end_date,
    }

def format_transaction(transaction: Transaction, session: Session):
    category = get_category_by_id(category_id=transaction.category_id, session=session)
    if category["status"] == "success":
        return {
            "id": transaction.id,
            "amount": transaction.amount,
            "is_in": transaction.is_in,
            "date": transaction.date,
            "reason": transaction.reason,
            "category_id": category["category"].id if category["status"] == "success" else None,
            "category_name": category["category"].name if category["status"] == "success" else None,
            "category_color": category["category"].color if category["status"] == "success" else None,
        }
    
def format_transacions(transactions: list[Transaction], session: Session):
    formatted_transactions = []
    for transaction in transactions:
        category = get_category_by_id(category_id=transaction.category_id, session=session)
        formatted_transaction = {
            "id": transaction.id,
            "amount": transaction.amount,
            "is_in": transaction.is_in,
            "date": transaction.date,
            "reason": transaction.reason,
            "category_id": category["category"].id if category["status"] == "success" else None,
            "category_name": category["category"].name if category["status"] == "success" else None,
            "category_color": category["category"].color if category["status"] == "success" else None,
        }
        formatted_transactions.append(formatted_transaction)
    
    return formatted_transactions
def update_transaction(transaction_id: int, transaction: Transaction_update, user_id: int, session: Session):
    transaction_to_update = get_transaction_by_id(transaction_id=transaction_id, session=session)

    if transaction_to_update["transaction"] == None:
        return {
            "status": "fail",
            "message": "transaction not found"
        }

    validation_error = validate_transaction_category_budget(
        transaction=transaction,
        user_id=user_id,
        session=session,
        transaction_id_to_exclude=transaction_id,
    )
    if validation_error:
        return {
            "status": "fail",
            "message": validation_error,
        }
        
    transaction_to_update = transaction_to_update['transaction']
    transaction_to_update.amount = transaction.amount
    transaction_to_update.is_in = transaction.is_in
    transaction_to_update.date = transaction.date
    transaction_to_update.reason = transaction.reason
    transaction_to_update.category_id = transaction.category_id

    session.add(transaction_to_update)
    session.commit()
    session.refresh(transaction_to_update)

    update_solde_of_user_id(user_id=user_id, session=session)
    return {
        "status": "success",
        "transaction": format_transaction(transaction_to_update, session)
    }

def update_solde_of_user_id(user_id: int, session: Session):
    from backend.services.auth.auth_services import get_user_by_id
    user_to_update = get_user_by_id(user_id=user_id, session=session)

    if user_to_update == None:
        return {
            "status": "fail",
            "message": "user not found"
        }

    amount_in = get_amount_in_of_user_by_user_id(user_id=user_id, session=session)
    if amount_in["status"] == "success":
        amount_in = amount_in["amount_in"]
    else:
        amount_in = 0.0

    amount_out = get_amount_out_of_user_by_user_id(user_id=user_id, session=session) 
    if amount_out["status"] == "success":
        amount_out = amount_out["amount_out"]
    else:
        amount_out = 0.0
    
    new_solde = amount_in - amount_out

    economy = get_economy_by_user_id(user_id=user_id, session=session)
    if economy:
        new_solde = amount_in*(100-economy)/100 - amount_out
    user_to_update = user_to_update['user']
    user_to_update.solde = new_solde

    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)

    return {
        "status": "success",
        "solde": new_solde
    }
    

def get_amount_in_of_user_by_user_id(
    user_id: int,
    session: Session,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    now = datetime.now()

    if start_date is None:
        start_date = now.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

    if end_date is None:
        end_date = now

    amount_in = session.exec(
        select(func.sum(Transaction.amount))
        .where(Transaction.user_id == user_id)
        .where(Transaction.is_in == True)
        .where(Transaction.date >= start_date)
        .where(Transaction.date <= end_date)
    ).one()

    return {
        "status": "success",
        "amount_in": amount_in or 0.0
    }


def get_amount_out_of_user_by_user_id(
    user_id: int,
    session: Session,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    now = datetime.now()

    if start_date is None:
        start_date = now.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

    if end_date is None:
        end_date = now

    amount_out = session.exec(
        select(func.sum(Transaction.amount))
        .where(Transaction.user_id == user_id)
        .where(Transaction.is_in == False)
        .where(Transaction.date >= start_date)
        .where(Transaction.date <= end_date)
    ).one()

    return {
        "status": "success",
        "amount_out": amount_out or 0.0
    }
    
    
def del_transaction_by_id(transaction_id: int, user_id: int, session: Session):
    transaction_to_delete = get_transaction_by_id(transaction_id=transaction_id, session=session)
    if transaction_to_delete["transaction"] == None:
        return {
            "status": "fail",
            "message": "transaction not found"
        }
    if transaction_to_delete["transaction"].user_id != user_id:
        return {
            "status": "fail",
            "message": "access denied",
        }
    session.delete(transaction_to_delete["transaction"])
    session.commit()

    # update user
    update_solde_of_user_id(user_id=user_id, session=session)

    return {
        "status": "success",
        "message": f"transaction with id {transaction_id} was deleted successfully !"
    }

def get_economy_by_user_id(user_id: int, session: Session):
    setting = session.exec(select(Setting).where(Setting.user_id == user_id)).first()
    if(setting is not None):
        return setting.economy
    return None
