from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session
from sqlalchemy.pool import QueuePool
from sqlalchemy import text
import os

# Configuration de la connexion avec pool et pré-ping
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,  # Recycler après 30 minutes
    pool_pre_ping=True,  # Vérifie la connexion avant utilisation
    connect_args={
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        try:
            # Teste et maintient la connexion active
            session.execute(text("SELECT 1"))
            yield session
        finally:
            session.close()