import os
import sys

# Add backend to path
sys.path.append(r"c:\Users\rushi\.gemini\antigravity-ide\scratch\modular-kitchen-inventory\backend")

from app.database import SessionLocal, get_db
from app.models import Product, Customer, User
from app.routers.transaction_router import handle_automatic_glue_consumption
from fastapi import BackgroundTasks

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
        # Run handle_automatic_glue_consumption
        bg = DummyBackgroundTasks()
        print("Running automatic glue consumption...")
        handle_automatic_glue_consumption(
            db=db,
            product=product,
            quantity=2.0,
            customer_id=customer.id,
            remarks="Test transaction",
            image_url=None,
            user_id=user.id,
            background_tasks=bg
        )
        print("Success!")
        db.commit()
    else:
        print("Missing product, customer, or user to run test.")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
