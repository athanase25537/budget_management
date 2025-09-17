from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from routes.user_routes import router as user_routes
from routes.transaction_routes import router as transaction_routes
from core.database import init_db

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # liste de domaines spécifiques en production
    allow_credentials=True,
    allow_methods=["*"],  # Autorise toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autorise tous les headers (ex: Content-Type, Authorization)
)

@app.on_event("startup")
def on_startup():
    init_db()
    
@app.get("/")
@app.head("/")  # Ajoutez le support de la méthode HEAD
def welcome(response: Response):
    # Pour les requêtes HEAD, on retourne juste les headers sans body
    if hasattr(response, 'method') and response.method == "HEAD":
        return Response(status_code=200)
    
    return { "message": "Welcome to Budget Management API !"}

app.include_router(router=user_routes, prefix="/user", tags=["User Routes"])
app.include_router(router=transaction_routes, prefix="/transaction", tags=["Transaction Routes"])