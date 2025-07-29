from fastapi import FastAPI
from routes.user_routes import router as user_routes

app = FastAPI()

app.include_router(router=user_routes, prefix="/user", tags=["User Routes"])