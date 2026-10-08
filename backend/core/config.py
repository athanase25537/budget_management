"""Centralized runtime configuration for the backend."""

import os
from pathlib import Path

from dotenv import load_dotenv


# A local file is useful for development; deployment-provided environment
# variables always take precedence.
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


DATABASE_URL = _required("DATABASE_URL")
SECRET_KEY = _required("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
