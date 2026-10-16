from fastapi import APIRouter, Depends
from sqlmodel import Session

from backend.core.database import get_session
from backend.core.errors import internal_server_error
from backend.services.auth.auth_security import get_current_user
from backend.services.sync.sync_models import SyncRequest
from backend.services.sync.sync_services import synchronize

router = APIRouter()


@router.post("/synchronize")
def synchronize_mobile_data(
    request: SyncRequest,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Apply an offline batch idempotently and return the current account snapshot."""
    try:
        return synchronize(
            user_id=current_user["user"].id,
            categories=request.categories,
            transactions=request.transactions,
            session=session,
        )
    except Exception:
        session.rollback()
        raise internal_server_error("Unable to synchronize mobile data") from None
