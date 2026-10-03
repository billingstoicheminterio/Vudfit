import time
import urllib.request
import urllib.parse
import json

base_url = "http://localhost:8000/api"

# Login
login_payload = urllib.parse.urlencode({
    "username": "admin",
    "password": "admin123"
}).encode("utf-8")

print("1. Logging in...")
try:
    req = urllib.request.Request(
        f"{base_url}/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    with urllib.request.urlopen(req) as response:
        resp_data = json.loads(response.read().decode("utf-8"))
        token = resp_data.get("access_token")
        print("Login successful!")
except Exception as e:
    print(f"Login failed: {e}")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Create a test product
product_data = {
    "name": f"Latency Test Product {int(time.time())}",
    "brand": "Hafele",
    "category_id": 1,
    "unit": "pcs",
    "min_stock": 10.0,
    "unit_cost": 50.0,
    "description": "Profiling network request time",
    "colour": "no"
}

print("\n2. Sending POST /products...")
t0 = time.time()
try:
    req = urllib.request.Request(
        f"{base_url}/products",
        data=json.dumps(product_data).encode("utf-8"),
        headers=headers
    )
    with urllib.request.urlopen(req) as response:
        duration = time.time() - t0
        resp_data = json.loads(response.read().decode("utf-8"))
        print(f"Request took: {duration:.4f} seconds")
        print(f"Product created: {resp_data.get('sku')}")
except Exception as e:
    print(f"Failed to create product: {e}")
