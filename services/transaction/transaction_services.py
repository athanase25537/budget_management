from models.budget_management_models import Transaction
from services.transaction.transaction_models import Transaction_create, Transaction_update
from services.auth.auth_services import get_user_by_id, get_user_by_username
from sqlmodel import select, Session
from sqlalchemy import func

def create_transaction(transaction: Transaction_create, session: Session):
    
    new_transaction: Transaction = Transaction(
        amount=transaction.amount,
        is_in=transaction.is_in,
        user_id=transaction.user_id,
        date=transaction.date,
        reason=transaction.reason
    )

    session.add(new_transaction)
    session.commit()
    session.refresh(new_transaction)

    return {
        "status": "success",
        "transaction": transaction
    }

def get_transaction_by_id(transaction_id: int, session: Session):
    transaction = session.exec(
        select(Transaction).where(Transaction.id ==  transaction_id)
    ).first()
    
    return { "transaction": transaction }

def get_transaction_by_user_id(user_id: int, session: Session):
    transaction = session.exec(
        select(Transaction).where(Transaction.user_id ==  user_id)
    ).first()
    
    return { "transaction": transaction }

def update_transaction(transaction_id: int, transaction: Transaction_update, session: Session):
    transaction_to_update = get_transaction_by_id(transaction_id=transaction_id, session=session)

    if transaction_to_update == None:
        return {
            "status": "fail",
            "message": "transaction not found"
        }
    
    transaction_to_update = transaction_to_update['user']
    transaction_to_update.amount = transaction.amount
    transaction_to_update.is_in = transaction.is_in
    transaction_to_update.date = transaction.date
    transaction_to_update.reason = transaction.reason

    session.add(transaction_to_update)
    session.commit()
    session.refresh(transaction_to_update)

    return {
        "status": "success",
        "transaction": transaction_to_update
    }

def update_solde_of_user_id(user_id: int, session: Session):
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
        return {
            "status": "fail",
            "message": "Solde not updated"
        }
    amount_out = get_amount_out_of_user_by_user_id(user_id=user_id, session=session) 
    if amount_out["status"] == "success":
        amount_out = amount_out["amount_out"]
    else:
        return {
            "status": "fail",
            "message": "Solde not updated"
        }
    
    new_solde = amount_in - amount_out
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
        "amount_in": amount_in}

def get_amount_out_of_user_by_user_id(user_id: int, session: Session):
    amount_out = session.exec(
        select(func.sum(Transaction.amount))
        .where(
            (Transaction.user_id == user_id) & (Transaction.is_in == False)
        )
    ).all()

    if amount_out[0] == None:
        return {
            "status": "fail",
            "message": "transaction not found"
        }

    return { 
        "status": "success",
        "amount_out": amount_out
    }

def del_transaction_by_id(transaction_id: int, session: Session):
    transaction_to_delete = get_transaction_by_id(transaction_id=transaction_id, session=session)
    if transaction_to_delete == None:
        return {
            "status": "fail",
            "message": "transaction not found"
        }
    
    session.delete(transaction_to_delete)
    session.commit()

    return {
        "status": "success",
        "message": f"transaction with id {transaction_id} was deleted successfully !"
    }