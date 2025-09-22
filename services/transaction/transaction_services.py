from models.budget_management_models import Transaction, Setting
from services.transaction.transaction_models import Transaction_create, Transaction_update
from services.auth.auth_services import get_user_by_id
from sqlmodel import select, Session
from sqlalchemy import func, desc
import logging

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

    # update user
    print("UPDATE USER")
    update_solde_of_user_id(user_id=transaction.user_id, session=session)

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
        select(Transaction)
        .where(Transaction.user_id ==  user_id)
        .order_by(desc(Transaction.date))
    ).all()
    
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
    print("here we are now...")

    if user_to_update == None:
        return {
            "status": "fail",
            "message": "user not found"
        }
    
    print("now we are here...")

    amount_in = get_amount_in_of_user_by_user_id(user_id=user_id, session=session)
    if amount_in["status"] == "success":
        amount_in = amount_in["amount_in"]
        print("on est bien ici...")
    else:
        print("on est a cote de la plaque...")
        amount_in = 0.0

    print("everything passed...")
    amount_out = get_amount_out_of_user_by_user_id(user_id=user_id, session=session) 
    if amount_out["status"] == "success":
        amount_out = amount_out["amount_out"]
        print("on est pas a l'abri ici...")
    else:
        amount_out = 0.0
    
    print("i think it's ok...")
    print(amount_in)
    new_solde = amount_in - amount_out

    economy = get_economy_by_user_id(user_id=user_id, session=session)
    
    if economy:
        print(f"economy: {economy}")
        new_solde = amount_in*(100-economy)/100 - amount_out
    user_to_update = user_to_update['user']
    user_to_update.solde = new_solde

    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)

    print(f"Solde: {new_solde} in: {amount_in} out: {amount_out} Now we are at the end... THANKS")
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

    print(f"AMOUNT IN {amount_in}")

    if amount_in[0] == None:
        print("amout in....")
        return {
            "status": "fail",
            "message": "transaction not found"
        }
    
    print("amount here....")
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

    print(f"AMOUNT OUT {amount_out}")

    if amount_out[0] == None:
        print("Nope")
        return {
            "status": "success",
            "amount_out": 0.0
        }

    print("ok")
    return { 
        "status": "success",
        "amount_out": amount_out[0]
    }

def del_transaction_by_id(transaction_id: int, user_id: int, session: Session):
    print("eto")
    transaction_to_delete = get_transaction_by_id(transaction_id=transaction_id, session=session)
    print("vita")
    if transaction_to_delete["transaction"] == None:
        return {
            "status": "fail",
            "message": "transaction not found"
        }
    session.delete(transaction_to_delete["transaction"])
    session.commit()

    # update user
    print("UPDATE USER")
    update_solde_of_user_id(user_id=user_id, session=session)

    return {
        "status": "success",
        "message": f"transaction with id {transaction_id} was deleted successfully !"
    }

def get_economy_by_user_id(user_id: int, session: Session):
    setting = session.exec(select(Setting).where(Setting.user_id == user_id)).first()
    print(f"economy: {setting.economy}")
    return setting.economy