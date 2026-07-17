from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from backend.core.database import get_session
from backend.services.auth.auth_security import get_current_user
from backend.services.transaction.transaction_services import (
    get_amount_in_of_user_by_user_id,
    get_amount_out_of_user_by_user_id,
    create_transaction,
    update_transaction,
    update_solde_of_user_id,
    del_transaction_by_id,
    get_transaction_by_id as get_trans_by_id,
    get_transaction_by_user_id as get_trans_by_user_id,
)
from backend.services.transaction.transaction_models import (
    Transaction_create,
    Transaction_update,
)

router = APIRouter()


@router.post("/create-transaction")
def create_user_transaction(
    transaction: Transaction_create,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        transaction.user_id = current_user["user"].id
        return create_transaction(transaction=transaction, session=session)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.put("/update-transaction-by-transaction-id/{transaction_id}")
def update_transaction_by_transaction_id(
    transaction_id: int,
    transaction: Transaction_update,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return update_transaction(
            transaction_id=transaction_id,
            transaction=transaction,
            user_id=current_user["user"].id,
            session=session,
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.put("/update-solde-user")
def update_solde_user(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return update_solde_of_user_id(
            user_id=current_user["user"].id,
            session=session,
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.delete("/delete-transaction/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return del_transaction_by_id(
            transaction_id=transaction_id,
            user_id=current_user["user"].id,
            session=session,
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.get("/transaction/{transaction_id}")
def get_transaction_by_id(
    transaction_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        transaction = get_trans_by_id(
            transaction_id=transaction_id,
            session=session,
        )

        if (
            transaction["status"] == "success"
            and transaction["transaction"].user_id != current_user["user"].id
        ):
            raise HTTPException(status_code=403, detail="Access denied")

        return transaction

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.get("/get-transactions-by-user-id")
def get_transactions(
    page: int = 1,
    items_per_page: int = 20,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return get_trans_by_user_id(
            user_id=current_user["user"].id,
            session=session,
            page=page,
            items_per_page=items_per_page,
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.get("/amount-in")
def get_amount_in(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return get_amount_in_of_user_by_user_id(
            user_id=current_user["user"].id,
            session=session,
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")


@router.get("/amount-out")
def get_amount_out(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        return get_amount_out_of_user_by_user_id(
            user_id=current_user["user"].id,
            session=session,
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"error: {e}")