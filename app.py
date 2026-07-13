from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.user_routes import router as user_router
from routes.transaction_routes import router as transaction_router
from routes.setting_routes import router as setting_router
from routes.category_routes import router as category_router
from services.auth.auth_security import router as security_router
from core.database import init_db


app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "https://budget-management-frontend-pchq.onrender.com"
    ],  # liste de domaines spécifiques en production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Autorise toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autorise tous les headers (ex: Content-Type, Authorization)
)

@app.on_event("startup")
def on_startup():
    init_db()
    
app.include_router(router=security_router, tags=["Security Routes"])
app.include_router(router=user_router, prefix="/user", tags=["User Routes"])
app.include_router(router=transaction_router, prefix="/transaction", tags=["Transaction Routes"])
app.include_router(setting_router, prefix="/setting", tags=["Setting"])
app.include_router(category_router, prefix="/category", tags=["Category Routes"])