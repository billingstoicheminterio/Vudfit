import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

new_pwd = sys.argv[1] if len(sys.argv) > 1 else "master123"

db = SessionLocal()
try:
    master = db.query(User).filter(User.username == "master").first()
    if master:
        master.password_hash = get_password_hash(new_pwd)
        master.is_active = True
        master.role = "master"
        db.commit()
        print(f"SUCCESS: Updated 'master' password to '{new_pwd}'")
    else:
        master = User(
            username="master",
            password_hash=get_password_hash(new_pwd),
            role="master",
            full_name="Master Administrator",
            is_active=True
        )
        db.add(master)
        db.commit()
        print(f"SUCCESS: Created 'master' account with password '{new_pwd}'")
finally:
    db.close()
