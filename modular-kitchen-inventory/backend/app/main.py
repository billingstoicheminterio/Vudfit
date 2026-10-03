import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from .database import engine, Base, SessionLocal, STORAGE_DIR

# Create tables in database first
Base.metadata.create_all(bind=engine)

# Run DB migrations
db = SessionLocal()
try:
    db.execute(text("ALTER TABLE products ADD COLUMN image_url VARCHAR;"))
    db.commit()
except Exception:
    db.rollback()

try:
    db.execute(text("ALTER TABLE transactions ADD COLUMN image_url VARCHAR;"))
    db.commit()
except Exception:
    db.rollback()

# Add code column to brands and categories if they don't exist
try:
    db.execute(text("ALTER TABLE brands ADD COLUMN code VARCHAR;"))
    db.commit()
except Exception:
    db.rollback()

try:
    db.execute(text("ALTER TABLE categories ADD COLUMN code VARCHAR;"))
    db.commit()
except Exception:
    db.rollback()

# Add redesign columns to products
columns_to_add = [
    "brand_code VARCHAR",
    "brand_name VARCHAR",
    "category_code VARCHAR",
    "category_name VARCHAR",
    "color_code VARCHAR",
    "color_name VARCHAR",
    "global_serial INTEGER"
]
for col in columns_to_add:
    try:
        db.execute(text(f"ALTER TABLE products ADD COLUMN {col};"))
        db.commit()
    except Exception:
        db.rollback()

# Add colour column to products table if not exists
try:
    db.execute(text("ALTER TABLE products ADD COLUMN colour VARCHAR DEFAULT 'no';"))
    db.commit()
except Exception:
    db.rollback()

# Seed redesigned default brands if not already present
try:
    has_new_brand = db.execute(text("SELECT 1 FROM brands WHERE name = 'Kassabohmer';")).scalar()
    if not has_new_brand:
        db.execute(text("DELETE FROM brands;"))
        new_brands = [
            ("Hettich", "HT"),
            ("Hefele", "HF"),
            ("Blum", "BL"),
            ("Kassabohmer", "KB"),
            ("Grass", "GR"),
            ("Veneto", "VN"),
            ("CNR", "CN"),
            ("Ebco", "EB"),
            ("Olive", "OL"),
            ("Pramukh", "PR"),
            ("Gajanan", "GJ"),
            ("Ajit Hardware", "AH"),
            ("Airolam", "AR"),
            ("Merino", "MR"),
            ("Vita", "VT"),
            ("Dexarte", "DX"),
            ("Makwana", "MW"),
            ("Rehau", "RH"),
            ("Godrej", "GJ")
        ]
        for name, code in new_brands:
            db.execute(text("INSERT INTO brands (name, code) VALUES (:name, :code);"), {"name": name, "code": code})
        db.commit()
except Exception:
    db.rollback()

# Backfill unique codes for existing brands and categories, and backfill products SKU
try:
    # 1. Backfill Brands codes if null
    brands_null_code = db.execute(text("SELECT id, name FROM brands WHERE code IS NULL OR code = '';")).all()
    brand_mapping = {
        "hettich": "HT", "hefele": "HF", "hafele": "HF", "blum": "BL", "kassabohmer": "KB", "grass": "GR",
        "veneto": "VN", "cnr": "CN", "ebco": "EB", "olive": "OL", "pramukh": "PR", "gajanan": "GJ",
        "ajit hardware": "AH", "airolam": "AR", "merino": "MR", "vita": "VT", "dexarte": "DX",
        "makwana": "MW", "rehau": "RH", "godrej": "GJ"
    }
    for b_id, b_name in brands_null_code:
        clean_name = b_name.strip().lower()
        code = brand_mapping.get(clean_name)
        if not code:
            code = "".join([c for c in clean_name if c.isalnum()])[:2].upper()
            if len(code) < 2:
                code = (code + "XX")[:2]
        duplicate_count = db.execute(text("SELECT COUNT(*) FROM brands WHERE code = :code;"), {"code": code}).scalar()
        if duplicate_count > 0:
            code = code[:1] + str(b_id)[-1:]
        db.execute(text("UPDATE brands SET code = :code WHERE id = :id;"), {"code": code, "id": b_id})
    db.commit()
except Exception as e:
    print(f"Error backfilling brands: {e}")
    db.rollback()

try:
    # 2. Backfill Categories codes if null
    categories_null_code = db.execute(text("SELECT id, name FROM categories WHERE code IS NULL OR code = '';")).all()
    cat_mapping = {
        "hinges": "HG", "hinge": "HG", "channels": "CH", "channel": "CH", "handles": "HD", "handle": "HD",
        "knobs": "KB", "knob": "KB", "baskets": "BS", "basket": "BS", "profiles": "PF", "profile": "PF",
        "screws": "SC", "screw": "SC", "adhesives": "AD", "adhesive": "AD", "edge band": "EB", "edgeband": "EB",
        "laminates": "LM", "laminate": "LM", "plywood": "PW", "mdf": "MD", "lighting": "LT", "accessories": "AC", "accessory": "AC"
    }
    for c_id, c_name in categories_null_code:
        clean_name = c_name.strip().lower()
        code = cat_mapping.get(clean_name)
        if not code:
            code = "".join([c for c in clean_name if c.isalnum()])[:2].upper()
            if len(code) < 2:
                code = (code + "XX")[:2]
        duplicate_count = db.execute(text("SELECT COUNT(*) FROM categories WHERE code = :code;"), {"code": code}).scalar()
        if duplicate_count > 0:
            code = code[:1] + str(c_id)[-1:]
        db.execute(text("UPDATE categories SET code = :code WHERE id = :id;"), {"code": code, "id": c_id})
    db.commit()
except Exception as e:
    print(f"Error backfilling categories: {e}")
    db.rollback()

try:
    # 3. Backfill Products: assign serial, code details, and generate new SKUs for existing products
    products_to_backfill = db.execute(text("SELECT id, name, brand, category_id, colour, sku FROM products WHERE global_serial IS NULL ORDER BY id;")).all()
    
    COLOR_CODES = {
        "black": "BK", "white": "WH", "silver": "SV", "grey": "GY", "gray": "GY",
        "gold": "GD", "brown": "BR", "natural": "NT", "not applicable": "NA", "na": "NA", "none": "NA"
    }
    
    def resolve_color_details(colour_val):
        if not colour_val or colour_val.strip() == "" or colour_val.lower() in ["no", "none", "na", "not applicable"]:
            return "NA", "Not Applicable"
        c_clean = colour_val.strip().lower()
        if c_clean in COLOR_CODES:
            return COLOR_CODES[c_clean], colour_val.strip()
        code = "".join([c for c in c_clean if c.isalnum()])[:2].upper()
        if len(code) < 2:
            code = (code + "XX")[:2]
        return code, colour_val.strip()

    max_serial = db.execute(text("SELECT MAX(global_serial) FROM products;")).scalar() or 0
    serial_counter = max_serial
    
    for p_id, p_name, p_brand_name, p_cat_id, p_colour, old_sku in products_to_backfill:
        serial_counter += 1
        
        b_rec = db.execute(text("SELECT code, name FROM brands WHERE name = :name;"), {"name": p_brand_name}).first()
        if b_rec:
            b_code, b_name = b_rec[0], b_rec[1]
        else:
            b_code = "".join([c for c in p_brand_name.lower() if c.isalnum()])[:2].upper()
            if len(b_code) < 2: b_code = (b_code + "XX")[:2]
            db.execute(text("INSERT INTO brands (name, code) VALUES (:name, :code);"), {"name": p_brand_name, "code": b_code})
            b_name = p_brand_name
            
        c_rec = db.execute(text("SELECT code, name FROM categories WHERE id = :id;"), {"id": p_cat_id}).first()
        if c_rec:
            c_code, c_name = c_rec[0], c_rec[1]
        else:
            c_code, c_name = "GEN", "General"
            
        col_code, col_name = resolve_color_details(p_colour)
        new_sku = f"VF-{b_code}-{c_code}-{col_code}-{serial_counter:06d}"
        
        db.execute(text("""
            UPDATE products 
            SET brand_code = :brand_code,
                brand_name = :brand_name,
                category_code = :category_code,
                category_name = :category_name,
                color_code = :color_code,
                color_name = :color_name,
                global_serial = :global_serial,
                sku = :sku,
                barcode = :barcode
            WHERE id = :id;
        """), {
            "brand_code": b_code,
            "brand_name": b_name,
            "category_code": c_code,
            "category_name": c_name,
            "color_code": col_code,
            "color_name": col_name,
            "global_serial": serial_counter,
            "sku": new_sku,
            "barcode": new_sku,
            "id": p_id
        })
        
    db.commit()
    
    # 4. Custom SKU Barcode Migration: assign VF- barcodes to custom SKU products that don't have one
    products_needs_barcode = db.execute(text("SELECT id, name, brand, category_id, colour, sku, barcode FROM products WHERE barcode NOT LIKE 'VF-%';")).all()
    if products_needs_barcode:
        print(f"Found {len(products_needs_barcode)} products needing VF- barcode migration.")
        max_serial = db.execute(text("SELECT MAX(global_serial) FROM products;")).scalar() or 0
        serial_counter = max_serial
        
        for p_id, p_name, p_brand_name, p_cat_id, p_colour, p_sku, p_barcode in products_needs_barcode:
            serial_counter += 1
            
            b_rec = db.execute(text("SELECT code, name FROM brands WHERE name = :name;"), {"name": p_brand_name}).first()
            if b_rec:
                b_code = b_rec[0]
            else:
                b_code = "".join([c for c in p_brand_name.lower() if c.isalnum()])[:2].upper()
                if len(b_code) < 2: b_code = (b_code + "XX")[:2]
                
            c_rec = db.execute(text("SELECT code FROM categories WHERE id = :id;"), {"id": p_cat_id}).first()
            if c_rec:
                c_code = c_rec[0]
            else:
                c_code = "GEN"
                
            col_code, _ = resolve_color_details(p_colour)
            new_barcode = f"VF-{b_code}-{c_code}-{col_code}-{serial_counter:06d}"
            
            db.execute(text("""
                UPDATE products 
                SET barcode = :barcode,
                    global_serial = :global_serial
                WHERE id = :id;
            """), {
                "barcode": new_barcode,
                "global_serial": serial_counter,
                "id": p_id
            })
        db.commit()
        print("Successfully migrated custom barcodes.")
except Exception as e:
    print(f"Error backfilling products: {e}")
    db.rollback()
finally:
    db.close()

from fastapi.middleware.gzip import GZipMiddleware
from .routers import (
    auth_router,
    category_router,
    supplier_router,
    product_router,
    transaction_router,
    inventory_router,
    ai_router,
    reports_router,
    customer_router,
    brand_router,
    backup_router,
)

app = FastAPI(
    title="Modular Kitchen Inventory Management API",
    description="Backend API for managing warehouse stocks, transactions, and barcode tracking",
    version="1.0.0"
)

# Enable CORS for frontend integration
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]
else:
    origins = [
        "http://localhost:5173",     # Vite React default port
        "http://127.0.0.1:5173",
        "http://localhost:3000",     # React alternative port
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Serve uploaded product images static files
UPLOADS_DIR = os.path.join(STORAGE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# WebSocket Endpoint
from fastapi import WebSocket, WebSocketDisconnect
from .websocket_manager import ws_manager

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Maintain connection alive, ignore incoming messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# Mount Routers under /api
app.include_router(auth_router.router, prefix="/api")
app.include_router(category_router.router, prefix="/api")
app.include_router(supplier_router.router, prefix="/api")
app.include_router(product_router.router, prefix="/api")
app.include_router(transaction_router.router, prefix="/api")
app.include_router(inventory_router.router, prefix="/api")
app.include_router(ai_router.router, prefix="/api")
app.include_router(reports_router.router, prefix="/api")
app.include_router(customer_router.router, prefix="/api")
app.include_router(brand_router.router, prefix="/api")
app.include_router(backup_router.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Modular Kitchen Inventory Management API",
        "docs_url": "/docs"
    }
