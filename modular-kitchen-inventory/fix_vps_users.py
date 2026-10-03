import sys
import os

# Set base dir
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load dotenv if present
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
    parent_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    if os.path.exists(parent_env):
        load_dotenv(parent_env)
except Exception as e:
    print(f"Dotenv note: {e}")

from app.database import SessionLocal, engine
from app.models import User
from app.auth import get_password_hash, verify_password

print(f"Connecting to database engine: {engine.url}")

db = SessionLocal()
try:
    print("\n--- CURRENT USER ACCOUNTS IN DATABASE ---")
    users = db.query(User).all()
    if not users:
        print("No users found in database!")
    for u in users:
        print(f"ID: {u.id} | Username: '{u.username}' | Role: '{u.role}' | Active: {u.is_active}")
    
    # 1. Reset or Create master
    master = db.query(User).filter(User.username == "master").first()
    if master:
        master.password_hash = get_password_hash("master123")
        master.is_active = True
        master.role = "master"
        db.commit()
        print("SUCCESS: Updated 'master' password to 'master123'")
    else:
        master = User(
            username="master",
            password_hash=get_password_hash("master123"),
            role="master",
            full_name="Master Administrator",
            is_active=True
        )
        db.add(master)
        db.commit()
        print("SUCCESS: Created 'master' user with password 'master123'")
        
    # 2. Reset or Create admin
    admin = db.query(User).filter(User.username == "admin").first()
    if admin:
        admin.password_hash = get_password_hash("admin123")
        admin.is_active = True
        admin.role = "admin"
        db.commit()
        print("SUCCESS: Updated 'admin' password to 'admin123'")
    else:
        admin = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            role="admin",
            full_name="System Administrator",
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("SUCCESS: Created 'admin' user with password 'admin123'")

    # 3. Reset or Create staff
    staff = db.query(User).filter(User.username == "staff").first()
    if staff:
        staff.password_hash = get_password_hash("staff123")
        staff.is_active = True
        staff.role = "staff"
        db.commit()
        print("SUCCESS: Updated 'staff' password to 'staff123'")
    else:
        staff = User(
            username="staff",
            password_hash=get_password_hash("staff123"),
            role="staff",
            full_name="Warehouse Operator",
            is_active=True
        )
        db.add(staff)
        db.commit()
        print("SUCCESS: Created 'staff' user with password 'staff123'")

    print("\n--- FINAL VERIFIED USER LIST ---")
    for u in db.query(User).all():
        v_master = verify_password("master123", u.password_hash) if u.username == "master" else False
        print(f"ID: {u.id} | Username: '{u.username}' | Role: '{u.role}' | Active: {u.is_active} | MasterPwMatch: {v_master}")

finally:
    db.close()
