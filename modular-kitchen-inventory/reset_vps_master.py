import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

db = SessionLocal()
try:
    master_user = db.query(User).filter(User.username == "master").first()
    if master_user:
        master_user.password_hash = get_password_hash("master123")
        master_user.is_active = True
        db.commit()
        print("Success: Live VPS master password set to 'master123'!")
    else:
        new_master = User(
            username="master",
            password_hash=get_password_hash("master123"),
            role="master",
            full_name="Master Administrator",
            is_active=True
        )
        db.add(new_master)
        db.commit()
        print("Success: Live VPS master account created with password 'master123'!")
finally:
    db.close()
