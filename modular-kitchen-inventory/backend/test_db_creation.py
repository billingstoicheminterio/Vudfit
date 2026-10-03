import time
import traceback
from app.database import SessionLocal, Base, engine
from app.models import Product, Category, Brand, User

db = SessionLocal()

print("1. Finding Category and Brand...")
category = db.query(Category).filter(Category.id == 1).first()
if not category:
    print("Seeding hinges category...")
    category = Category(id=1, name="Hinges", code="HG")
    db.add(category)
    db.commit()

brand_rec = db.query(Brand).filter(Brand.name == "Hafele").first()
if not brand_rec:
    brand_rec = Brand(name="Hafele", code="HF")
    db.add(brand_rec)
    db.commit()

print(f"Category: {category.name}, Brand: {brand_rec.name}")

# Generate SKU and Barcode
print("\n2. Simulating SKU Generation...")
brand_code = brand_rec.code
category_code = category.code or "GEN"
color_code = "NA"

t0 = time.time()
max_serial = db.query(func_max_val := func_max_val if 'func_max_val' in globals() else None).scalar() or 0
from sqlalchemy import func
max_serial = db.query(func.max(Product.global_serial)).scalar() or 0
global_serial = max_serial + 1

sku = f"VF-{brand_code}-{category_code}-{color_code}-{global_serial:06d}"
barcode = sku

exists_sku = db.query(Product).filter(Product.sku == sku).first()
while exists_sku:
    global_serial += 1
    sku = f"VF-{brand_code}-{category_code}-{color_code}-{global_serial:06d}"
    barcode = sku
    exists_sku = db.query(Product).filter(Product.sku == sku).first()

print(f"SKU generated: {sku} in {time.time() - t0:.6f} seconds")

# Create product
print("\n3. Inserting Product record...")
product = Product(
    sku=sku,
    name=f"Direct DB Test Hinge {int(time.time())}",
    brand=brand_rec.name,
    category_id=category.id,
    unit="pcs",
    barcode=barcode,
    min_stock=10.0,
    unit_cost=50.0,
    description="Testing db latency directly",
    colour="Not Applicable",
    brand_code=brand_code,
    brand_name=brand_rec.name,
    category_code=category_code,
    category_name=category.name,
    color_code=color_code,
    color_name="Not Applicable",
    global_serial=global_serial
)

t0 = time.time()
try:
    db.add(product)
    db.commit()
    db.refresh(product)
    print(f"Successfully inserted and refreshed product {product.id} in {time.time() - t0:.6f} seconds")
except Exception as e:
    db.rollback()
    print("INSERT FAILED:")
    traceback.print_exc()
finally:
    # Delete the test product to avoid clutter
    if 'product' in locals() and product.id:
        db.delete(product)
        db.commit()
        print("Cleaned up test product.")
    db.close()
