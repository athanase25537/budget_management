from fastapi import FastAPI
from routes.user_routes import router as user_routes
from core.database import init_db
app = FastAPI()

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(router=user_routes, prefix="/user", tags=["User Routes"])