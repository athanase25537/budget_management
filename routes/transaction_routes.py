from fastapi import APIRouter, Depends, HTTPException
from services.transaction.transaction_services import create_transaction, update_transaction, update_solde_of_user_id, del_transaction_by_id 
from services.transaction.transaction_models import Transaction_create, Transaction_update
from core.database import get_session
from sqlmodel import Session

router = APIRouter()

@router.get('/')
def welcome():
    return { "message": "Welcome to Budget Management API: [transaction] !"}


@router.post('/create-transaction')
def create_user_transaction(transaction: Transaction_create, session: Session = Depends(get_session)):
    try:
        return create_transaction(transaction=transaction, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")
    
@router.put('/update-transaction-by-transaction-id/{transaction_id}')
def update_transaction_by_transaction_id(transaction_id: int, transaction: Transaction_update, session: Session = Depends(get_session)):
    try:
        return update_transaction(transaction_id=transaction_id, transaction=transaction, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")
    
@router.put("/update-solde-user-by-user-id/{user_id}")
def update_solde_user_by_user_id(user_id: int, session: Session = Depends(get_session)):
    try:
        return update_solde_of_user_id(user_id=user_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")   
    
@router.delete("/delete-transaction-by_transaction-id/{transaction_id}")
def delete_transaction_by_transaction_id(transaction_id: int, session: Session = Depends(get_session)):
    try:
        return del_transaction_by_id(transaction_id=transaction_id, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}") 