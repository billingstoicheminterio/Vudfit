import os
import sys

# Add backend to path
sys.path.append(r"c:\Users\rushi\.gemini\antigravity-ide\scratch\modular-kitchen-inventory\backend")

from app.database import SessionLocal
from app.routers.customer_router import get_customer_invoice

db = SessionLocal()
try:
    print("Fetching invoice for customer_id = 1...")
    res = get_customer_invoice(customer_id=1, db=db)
    print("Summary:")
    for item in res.get("summary", []):
        print(f"  SKU: {item['product_sku']}, Name: {item['product_name']}, Issued: {item['total_issued']}, Returned: {item['total_returned']}, Net: {item['net_consumed']} {item['unit']}")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
