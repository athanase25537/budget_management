"""Cloudflare Workers entry point for the FastAPI application.

Cloudflare exposes secrets and bindings on ``WorkerEntrypoint.env`` rather
than through ``os.environ``.  The existing application reads its settings at
import time, so it must only be imported after those values have been copied
from the Worker environment.
"""

import os

from workers import WorkerEntrypoint, asgi


_app = None


def _configure_application_environment(env) -> None:
    """Copy the Worker secrets required by the existing FastAPI app.

    ``DATABASE_URL`` should use SQLAlchemy's psycopg dialect when connecting
    to Postgres from Workers, for example ``postgresql+psycopg://...``.
    """
    required = ("DATABASE_URL", "SECRET_KEY")
    missing = []

    for name in required:
        value = getattr(env, name, None)
        if value is None or not str(value):
            missing.append(name)
        else:
            os.environ[name] = str(value)

    algorithm = getattr(env, "ALGORITHM", None)
    if algorithm:
        os.environ["ALGORITHM"] = str(algorithm)

    cors_origins = getattr(env, "CORS_ORIGINS", None)
    if cors_origins:
        os.environ["CORS_ORIGINS"] = str(cors_origins)

    if missing:
        names = ", ".join(missing)
        raise RuntimeError(f"Missing Cloudflare Worker secret(s): {names}")


class Default(WorkerEntrypoint):
    """Cloudflare's ``fetch`` handler, bridged to the FastAPI ASGI app."""

    async def fetch(self, request):
        global _app

        if _app is None:
            _configure_application_environment(self.env)

            # Delaying this import is intentional: config.py validates the
            # environment while the routers are imported.
            from backend.app import app

            _app = app

        return await asgi.fetch(_app, request, self.env)
