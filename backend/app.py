import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.user_routes import router as user_router
from backend.routes.transaction_routes import router as transaction_router
from backend.routes.setting_routes import router as setting_router
from backend.routes.category_routes import router as category_router
from backend.services.auth.auth_security import router as security_router


app = FastAPI()

default_origins = [
    "http://localhost:4200",
    "https://budget-management-frontend-pchq.onrender.com",
]
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
] or default_origins

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],  # Autorise tous les headers (ex: Content-Type, Authorization)
)

app.include_router(router=security_router, tags=["Security Routes"])
app.include_router(router=user_router, prefix="/user", tags=["User Routes"])
app.include_router(router=transaction_router, prefix="/transaction", tags=["Transaction Routes"])
app.include_router(setting_router, prefix="/setting", tags=["Setting"])
app.include_router(category_router, prefix="/category", tags=["Category Routes"])
