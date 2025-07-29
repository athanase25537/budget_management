from fastapi import FastAPI
from routes.user_routes import router as user_routes
from routes.transaction_routes import router as transaction_routes
from core.database import init_db
app = FastAPI()

@app.on_event("startup")
def on_startup():
    init_db()
@app.get("/")
def welcome():
    return { "message": "Welcome to Budget Management API !"}

app.include_router(router=user_routes, prefix="/user", tags=["User Routes"])
app.include_router(router=transaction_routes, prefix="/transaction", tags=["Transaction Routes"])