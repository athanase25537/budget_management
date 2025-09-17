# database.py
from sqlmodel import create_engine, SQLModel, Session
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# AJOUTEZ CES PARAMÈTRES CRUCIAUX :
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "sslmode": "require",
        "options": "-c statement_timeout=30000 -c connect_timeout=10"
    },
    pool_pre_ping=True,  # Teste la connexion avant utilisation
    pool_recycle=1800,   # Recycler les connexions toutes les 30 minutes
    pool_timeout=30,     # Timeout de 30 secondes
    max_overflow=10      # Permet plus de connexions simultanées
)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session