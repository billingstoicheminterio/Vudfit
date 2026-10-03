import time
from app.database import SessionLocal
from app.models import Product, Category, Brand

db = SessionLocal()

print("1. Profiling Category lookup...")
t0 = time.time()
category = db.query(Category).first()
print(f"Category query took: {time.time() - t0:.6f} seconds")

print("\n2. Profiling Brand lookup...")
t0 = time.time()
brand = db.query(Brand).filter(Brand.name == "Hafele").first()
print(f"Brand query took: {time.time() - t0:.6f} seconds")

print("\n3. Profiling max serial lookup...")
t0 = time.time()
from sqlalchemy import func
max_serial = db.query(func.max(Product.global_serial)).scalar() or 0
print(f"Max serial: {max_serial}")
print(f"Max serial query took: {time.time() - t0:.6f} seconds")

print("\n4. Profiling product list fetch...")
t0 = time.time()
products = db.query(Product).all()
print(f"Loaded {len(products)} products in: {time.time() - t0:.6f} seconds")

print("\n5. Profiling transaction grouping stock query...")
t0 = time.time()
from app.models import Transaction
product_ids = [p.id for p in products]
stock_dict = {}
if product_ids:
    stock_sums = db.query(
        Transaction.product_id,
        Transaction.type,
        func.sum(Transaction.quantity)
    ).filter(Transaction.product_id.in_(product_ids)).group_by(Transaction.product_id, Transaction.type).all()
    for pid, t_type, qty_sum in stock_sums:
        if pid not in stock_dict:
            stock_dict[pid] = 0.0
        val = float(qty_sum or 0.0)
        if t_type in ("inward", "return"):
            stock_dict[pid] += val
        elif t_type == "outward":
            stock_dict[pid] -= val
print(f"Calculated stock for {len(products)} products in: {time.time() - t0:.6f} seconds")

db.close()
