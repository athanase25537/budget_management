"""Shared HTTP error helpers that avoid leaking internal details."""

import logging

from fastapi import HTTPException


logger = logging.getLogger("backend")


def internal_server_error(message: str) -> HTTPException:
    logger.exception(message)
    return HTTPException(status_code=500, detail="Internal server error")
