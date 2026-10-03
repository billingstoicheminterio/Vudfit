import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Set paths relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.path.join(os.path.dirname(BASE_DIR), "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

# Also create backup directory structure
BACKUP_DIR = os.path.join(os.path.dirname(BASE_DIR), "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

# Read DATABASE_URL from environment variable (e.g. on Railway/Render)
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    # Convert postgres:// to postgresql:// as required by SQLAlchemy 2.x
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)
else:
    DATABASE_URL = f"sqlite:///{os.path.join(STORAGE_DIR, 'inventory.db')}"
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
