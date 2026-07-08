from unicodedata import category

from models.budget_management_models import Transaction, Setting
from services.transaction.transaction_models import Transaction_create, Transaction_update
from services.category.category_services import get_category_by_id
from sqlmodel import select, Session
from sqlalchemy import func, desc

def create_transaction(transaction: Transaction_create, session: Session):

    # check if category exist
    category = get_category_by_id(category_id=transaction.category_id, session=session)

    if category["status"] == "fail":
        return {
            "status": "fail",
            "message": "category not found"
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

def get_transaction_by_user_id(user_id: int, session: Session, page: int = 1, items_per_page: int = 20):
    transaction = session.exec(
        select(Transaction)
        .where(Transaction.user_id ==  user_id)
        .order_by(desc(Transaction.date))
        .offset((page - 1) * items_per_page)
        .limit(items_per_page)
    ).all()
    
    transaction = format_transacions(transactions=transaction, session=session)
    
    transaction_count = session.exec(
        select(func.count(Transaction.id))
        .where(Transaction.user_id == user_id)
    ).one()
    
    transaction_left = transaction_count - (page * items_per_page)
    return { 
        "transactions": transaction,
        "has_next_page": transaction_left > 0,
        "has_previous_page": page > 1,
        "current_page": page,
        "element_per_page": items_per_page,
        "total": transaction_count
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
def update_transaction(transaction_id: int, transaction: Transaction_update, session: Session):
    transaction_to_update = get_transaction_by_id(transaction_id=transaction_id, session=session)

    if transaction_to_update["transaction"] == None:
        return {
            "status": "fail",
            "message": "transaction not found"
        }

    # check if category exist
    category = get_category_by_id(category_id=transaction.category_id, session=session)
    if not category:
        return {
            "status": "fail",
            "message": "category not found"
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

    update_solde_of_user_id(user_id=transaction_to_update.user_id, session=session)
    return {
        "status": "success",
        "transaction": transaction_to_update
    }

def update_solde_of_user_id(user_id: int, session: Session):
    from services.auth.auth_services import get_user_by_id
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

def get_amount_in_of_user_by_user_id(user_id: int, session: Session):
    amount_in = session.exec(
        select(func.sum(Transaction.amount))
        .where(
            (Transaction.user_id == user_id) & (Transaction.is_in == True)
        )
    ).all()

    if amount_in[0] == None:
        return {
            "status": "fail",
            "message": "transaction not found"
        }
    
    return { 
        "status": "success",
        "amount_in": amount_in[0]
    }

def get_amount_out_of_user_by_user_id(user_id: int, session: Session):
    amount_out = session.exec(
        select(func.sum(Transaction.amount))
        .where(
            (Transaction.user_id == user_id) & (Transaction.is_in == False)
        )
    ).all()

    if amount_out[0] == None:
        return {
            "status": "success",
            "amount_out": 0.0
        }

    return { 
        "status": "success",
        "amount_out": amount_out[0]
    }

def del_transaction_by_id(transaction_id: int, user_id: int, session: Session):
    transaction_to_delete = get_transaction_by_id(transaction_id=transaction_id, session=session)
    if transaction_to_delete["transaction"] == None:
        return {
            "status": "fail",
            "message": "transaction not found"
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