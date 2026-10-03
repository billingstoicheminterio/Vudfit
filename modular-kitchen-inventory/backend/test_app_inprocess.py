import traceback
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models import User, Category, Brand

client = TestClient(app)

print("1. Preparing database tables...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Ensure we have an admin user
admin = db.query(User).filter(User.username == "admin").first()
if not admin:
    print("Seeding admin user...")
    import bcrypt
    pwd_bytes = "admin123".encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    admin = User(username="admin", password_hash=hashed, role="admin", full_name="Admin", is_active=True)
    db.add(admin)
    db.commit()

# Ensure we have a Category with ID 1
cat = db.query(Category).filter(Category.id == 1).first()
if not cat:
    print("Seeding hinges category...")
    cat = Category(id=1, name="Hinges", code="HG")
    db.add(cat)
    db.commit()

db.close()

# Login to get token
print("\n2. Simulating login in-process...")
response = client.post(
    "/api/auth/login",
    data={"username": "admin", "password": "admin123"},
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)
if response.status_code != 200:
    print(f"Login failed: {response.text}")
    exit(1)

token = response.json()["access_token"]
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Create product payload
product_data = {
    "name": "Test Hinge In Process",
    "brand": "Hafele",
    "category_id": 1,
    "unit": "pcs",
    "min_stock": 10.0,
    "unit_cost": 50.0,
    "description": "Profiling in process",
    "colour": "no"
}

print("\n3. Posting product in-process...")
try:
    response = client.post(
        "/api/products",
        json=product_data,
        headers=headers
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print("CRASH DETECTED:")
    traceback.print_exc()
