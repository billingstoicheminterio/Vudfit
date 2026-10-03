import os
import sys

# Add backend to path
sys.path.append(r"c:\Users\rushi\.gemini\antigravity-ide\scratch\modular-kitchen-inventory\backend")

from app.database import SessionLocal
from app.models import Product, Customer, User
from app.schemas import BulkTransactionCreateOutward, BulkOutwardItem
from app.routers.transaction_router import record_outward_bulk
from fastapi import BackgroundTasks, Request

class DummyRequest:
    base_url = "http://localhost:8000"

class DummyBackgroundTasks(BackgroundTasks):
    def add_task(self, func, *args, **kwargs):
        pass

db = SessionLocal()
try:
    product = db.query(Product).filter(Product.sku == "VF-G5-PW-NA-000007").first()
    print("Found product:", product.name if product else "None")
    
    customer = db.query(Customer).first()
    print("Found customer:", customer.name if customer else "None")
    
    user = db.query(User).first()
    print("Found user:", user.username if user else "None")
    
    if product and customer and user:
        bulk_out = BulkTransactionCreateOutward(
            customer_id=customer.id,
            remarks="E2E Endpoint Test",
            image_url="/static/uploads/tx_dummy.jpg",
            items=[
                BulkOutwardItem(
                    product_barcode_or_sku=product.sku,
                    quantity=1.0,
                    remarks="1 sheet of plywood",
                    image_url="/static/uploads/tx_dummy.jpg"
                )
            ]
        )
        bg = DummyBackgroundTasks()
        req = DummyRequest()
        
        print("Invoking record_outward_bulk...")
        res = record_outward_bulk(
            bulk_out=bulk_out,
            background_tasks=bg,
            request=req,
            current_user=user,
            db=db
        )
        print("Success, returned response:", res)
    else:
        print("Missing required objects.")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
