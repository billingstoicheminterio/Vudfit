from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from ..database import get_db
from ..models import Product, Category, Transaction, User, AuditLog, Brand
from ..schemas import ProductResponse, ProductCreate, ProductUpdate
from ..auth import get_current_user, get_admin_user, get_master_user

router = APIRouter(prefix="/products", tags=["Products"])

def get_product_stock(db: Session, product_id: int) -> float:
    inward = db.query(func.sum(Transaction.quantity)).filter(
        Transaction.product_id == product_id,
        Transaction.type == "inward"
    ).scalar() or 0.0
    
    ret = db.query(func.sum(Transaction.quantity)).filter(
        Transaction.product_id == product_id,
        Transaction.type == "return"
    ).scalar() or 0.0
    
    outward = db.query(func.sum(Transaction.quantity)).filter(
        Transaction.product_id == product_id,
        Transaction.type == "outward"
    ).scalar() or 0.0
    
    return float(inward + ret - outward)

def generate_unique_brand_code(db: Session, brand_name_str: str) -> str:
    cleaned = "".join([c for c in brand_name_str if c.isalnum()]).upper()
    if len(cleaned) < 2:
        cleaned = (cleaned + "XX")[:2]
    
    base_code = cleaned[:2]
    existing = db.query(Brand).filter(func.upper(Brand.code) == base_code).first()
    if not existing:
        return base_code

    first_char = cleaned[0]
    for char in cleaned[1:]:
        candidate = f"{first_char}{char}"
        existing = db.query(Brand).filter(func.upper(Brand.code) == candidate).first()
        if not existing:
            return candidate

    for digit in "0123456789":
        candidate = f"{first_char}{digit}"
        existing = db.query(Brand).filter(func.upper(Brand.code) == candidate).first()
        if not existing:
            return candidate

    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        candidate = f"{first_char}{letter}"
        existing = db.query(Brand).filter(func.upper(Brand.code) == candidate).first()
        if not existing:
            return candidate

    return f"{first_char}{uuid.uuid4().hex[:1].upper()}"

def make_product_response(db: Session, p: Product, stock_dict: Optional[dict] = None) -> ProductResponse:
    if stock_dict is not None:
        stock = stock_dict.get(p.id, 0.0)
    else:
        stock = get_product_stock(db, p.id)
    res = ProductResponse.model_validate(p)
    res.current_stock = stock
    if not res.category_name and p.category:
        res.category_name = p.category.name
    return res

@router.get("", response_model=List[ProductResponse])
def list_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_filter),
                Product.sku.ilike(search_filter),
                Product.barcode.ilike(search_filter),
                Product.brand.ilike(search_filter),
                Product.brand_name.ilike(search_filter),
                Product.brand_code.ilike(search_filter),
                Product.category_name.ilike(search_filter),
                Product.category_code.ilike(search_filter),
                Product.color_name.ilike(search_filter),
                Product.color_code.ilike(search_filter)
            )
        )
        
    products = query.all()
    
    # Pre-calculate stock for all products in a single query (prevents N+1 database queries)
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
                
    return [make_product_response(db, p, stock_dict) for p in products]

@router.get("/{id_or_barcode}", response_model=ProductResponse)
def get_product(
    id_or_barcode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If the barcode/ID is a URL, extract the last segment of the path
    if "/" in id_or_barcode:
        parts = [p.strip() for p in id_or_barcode.split("/") if p.strip()]
        if parts:
            id_or_barcode = parts[-1]
            
    # Try finding by ID first
    product = None
    if id_or_barcode.isdigit():
        product = db.query(Product).filter(Product.id == int(id_or_barcode)).first()
        
    # Try exact case-sensitive match first (utilizes database index instantly)
    if not product:
        product = db.query(Product).filter(
            or_(
                Product.barcode == id_or_barcode,
                Product.sku == id_or_barcode
            )
        ).first()
        
    # Fallback to case-insensitive match (does a full table scan) if still not found
    if not product:
        product = db.query(Product).filter(
            or_(
                func.lower(Product.barcode) == id_or_barcode.lower(),
                func.lower(Product.sku) == id_or_barcode.lower()
            )
        ).first()
        
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return make_product_response(db, product)

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    # Verify category exists
    category = db.query(Category).filter(Category.id == product_in.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Category does not exist")
        
    # Resolve brand
    brand_rec = db.query(Brand).filter(
        or_(
            func.lower(Brand.name) == product_in.brand.lower(),
            func.upper(Brand.code) == product_in.brand.upper()
        )
    ).first()
    if not brand_rec:
        b_name = product_in.brand.strip()
        b_code = generate_unique_brand_code(db, b_name)
        brand_rec = Brand(name=b_name, code=b_code)
        db.add(brand_rec)
        db.commit()
        db.refresh(brand_rec)
        
    brand_code = brand_rec.code
    brand_name = brand_rec.name
    
    category_code = category.code or "GEN"
    category_name = category.name
    
    # Resolve color
    COLOR_CODES = {
        "black": "BK", "white": "WH", "silver": "SV", "grey": "GY", "gray": "GY",
        "gold": "GD", "brown": "BR", "natural": "NT", "not applicable": "NA", "na": "NA", "none": "NA"
    }
    
    if product_in.color_code and product_in.color_name:
        color_code = product_in.color_code.strip().upper()
        color_name = product_in.color_name.strip()
    else:
        colour_val = product_in.colour
        if not colour_val or colour_val.strip() == "" or colour_val.lower() in ["no", "none", "na", "not applicable"]:
            color_code, color_name = "NA", "Not Applicable"
        else:
            c_clean = colour_val.strip().lower()
            if c_clean in COLOR_CODES:
                color_code, color_name = COLOR_CODES[c_clean], colour_val.strip()
            else:
                c_code = "".join([c for c in c_clean if c.isalnum()])[:2].upper()
                if len(c_code) < 2:
                    c_code = (c_code + "XX")[:2]
                color_code, color_name = c_code, colour_val.strip()
                
    # Generate SKU and Barcode
    max_serial = db.query(func.max(Product.global_serial)).scalar() or 0
    global_serial = max_serial + 1
    
    generated_code = f"VF-{brand_code}-{category_code}-{color_code}-{global_serial:06d}"
    
    exists_barcode = db.query(Product).filter(Product.barcode == generated_code).first()
    while exists_barcode:
        global_serial += 1
        generated_code = f"VF-{brand_code}-{category_code}-{color_code}-{global_serial:06d}"
        exists_barcode = db.query(Product).filter(Product.barcode == generated_code).first()
        
    if product_in.sku and product_in.sku.strip() != "":
        sku = product_in.sku.strip()
        # Verify custom SKU is unique
        exists_sku = db.query(Product).filter(Product.sku == sku).first()
        if exists_sku:
            raise HTTPException(status_code=400, detail=f"SKU {sku} is already in use by another product")
        barcode = generated_code
    else:
        sku = generated_code
        barcode = generated_code
        
    product = Product(
        sku=sku,
        name=product_in.name,
        brand=brand_name,
        category_id=product_in.category_id,
        unit=product_in.unit,
        barcode=barcode,
        min_stock=product_in.min_stock,
        unit_cost=product_in.unit_cost,
        description=product_in.description,
        image_url=product_in.image_url,
        colour=color_name,
        brand_code=brand_code,
        brand_name=brand_name,
        category_code=category_code,
        category_name=category_name,
        color_code=color_code,
        color_name=color_name,
        global_serial=global_serial
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Audit log
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="CREATE_PRODUCT",
        details=f"Created product: {product.name} (SKU: {product.sku})"
    )
    db.add(audit_entry)
    db.commit()
    
    return make_product_response(db, product)

@router.put("/{id}", response_model=ProductResponse)
def update_product(
    id: int,
    product_in: ProductUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if product_in.category_id is not None:
        category = db.query(Category).filter(Category.id == product_in.category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="Category does not exist")
        product.category_id = product_in.category_id
        product.category_code = category.code
        product.category_name = category.name
        
    if product_in.name is not None:
        product.name = product_in.name
        
    if product_in.brand is not None:
        product.brand = product_in.brand
        brand_rec = db.query(Brand).filter(
            or_(
                func.lower(Brand.name) == product_in.brand.lower(),
                func.upper(Brand.code) == product_in.brand.upper()
            )
        ).first()
        if brand_rec:
            product.brand_name = brand_rec.name
            product.brand_code = brand_rec.code
        else:
            b_name = product_in.brand.strip()
            b_code = generate_unique_brand_code(db, b_name)
            brand_rec = Brand(name=b_name, code=b_code)
            db.add(brand_rec)
            db.commit()
            db.refresh(brand_rec)
            product.brand_name = brand_rec.name
            product.brand_code = brand_rec.code
            
    if product_in.unit is not None:
        product.unit = product_in.unit
    if product_in.min_stock is not None:
        product.min_stock = product_in.min_stock
    if product_in.unit_cost is not None:
        product.unit_cost = product_in.unit_cost
    if product_in.description is not None:
        product.description = product_in.description
    if product_in.image_url is not None:
        product.image_url = product_in.image_url
        
    if product_in.colour is not None or product_in.color_code is not None or product_in.color_name is not None:
        COLOR_CODES = {
            "black": "BK", "white": "WH", "silver": "SV", "grey": "GY", "gray": "GY",
            "gold": "GD", "brown": "BR", "natural": "NT", "not applicable": "NA", "na": "NA", "none": "NA"
        }
        if product_in.color_code and product_in.color_name:
            product.color_code = product_in.color_code.strip().upper()
            product.color_name = product_in.color_name.strip()
            product.colour = product_in.color_name.strip()
        elif product_in.colour is not None:
            colour_val = product_in.colour
            if not colour_val or colour_val.strip() == "" or colour_val.lower() in ["no", "none", "na", "not applicable"]:
                product.color_code, product.color_name = "NA", "Not Applicable"
                product.colour = "Not Applicable"
            else:
                c_clean = colour_val.strip().lower()
                if c_clean in COLOR_CODES:
                    product.color_code, product.color_name = COLOR_CODES[c_clean], colour_val.strip()
                else:
                    c_code = "".join([c for c in c_clean if c.isalnum()])[:2].upper()
                    if len(c_code) < 2:
                        c_code = (c_code + "XX")[:2]
                    product.color_code, product.color_name = c_code, colour_val.strip()
                product.colour = colour_val.strip()
        
    if product_in.barcode is not None:
        duplicate_barcode = db.query(Product).filter(
            Product.barcode == product_in.barcode,
            Product.id != id
        ).first()
        if duplicate_barcode:
            raise HTTPException(status_code=400, detail="Barcode is already in use by another product")
        product.barcode = product_in.barcode
        
    db.commit()
    db.refresh(product)
    
    # Audit log
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="UPDATE_PRODUCT",
        details=f"Updated product: {product.name} (SKU: {product.sku})"
    )
    db.add(audit_entry)
    db.commit()
    
    return make_product_response(db, product)

@router.delete("/{id}")
def delete_product(
    id: int,
    current_user: User = Depends(get_master_user), # Master only!
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    sku = product.sku
    name = product.name
    
    db.delete(product)
    
    # Audit log
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="DELETE_PRODUCT",
        details=f"Deleted product: {name} (SKU: {sku})"
    )
    db.add(audit_entry)
    db.commit()
    
    return {"message": f"Product {name} (SKU: {sku}) has been deleted successfully"}


# Image upload endpoint
from fastapi import File, UploadFile
import os
import shutil
import uuid
from ..database import STORAGE_DIR

@router.post("/{product_id}/image", response_model=ProductResponse)
def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Ensure it is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image type")
        
    # Get extension and check security whitelist
    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG, PNG, GIF, and WEBP image uploads are allowed."
        )
        
    # Generate unique filename
    filename = f"prod_{product_id}_{uuid.uuid4().hex}{ext}"
    uploads_dir = os.path.join(STORAGE_DIR, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_path = os.path.join(uploads_dir, filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update product record
    product.image_url = f"/static/uploads/{filename}"
    db.commit()
    db.refresh(product)
    
    return make_product_response(db, product)


# Bulk Product Operations (Master role only)
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import or_

class BulkProductCreateItem(BaseModel):
    name: str
    brand: str
    sku: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    unit: str
    min_stock: float = 0.0
    current_stock: Optional[float] = 0.0
    initial_stock: Optional[float] = 0.0
    unit_cost: float = 0.0
    colour: Optional[str] = "Not Applicable"
    description: Optional[str] = None

class BulkDeleteSKUs(BaseModel):
    skus: List[str]

@router.post("/bulk", response_model=List[ProductResponse], status_code=status.HTTP_201_CREATED)
def bulk_create_products(
    products_in: List[BulkProductCreateItem],
    current_user: User = Depends(get_admin_user),  # Admin or Master roles
    db: Session = Depends(get_db)
):
    max_serial = db.query(func.max(Product.global_serial)).scalar() or 0
    current_serial = max_serial
    
    created_products = []
    batch_skus = set()
    COLOR_CODES = {
        "black": "BK", "white": "WH", "silver": "SV", "grey": "GY", "gray": "GY",
        "gold": "GD", "brown": "BR", "natural": "NT", "not applicable": "NA", "na": "NA", "none": "NA"
    }
    
    for item in products_in:
        item_sku = item.sku.strip() if item.sku and item.sku.strip() != "" else None
        init_stock_val = float(item.current_stock or item.initial_stock or 0.0)
        
        # Check if product already exists by SKU or by (Name + Brand)
        existing_product = None
        if item_sku:
            existing_product = db.query(Product).filter(
                or_(
                    Product.sku == item_sku,
                    func.lower(Product.sku) == item_sku.lower()
                )
            ).first()
            
        if not existing_product and item.name and item.brand:
            existing_product = db.query(Product).filter(
                func.lower(Product.name) == item.name.strip().lower(),
                func.lower(Product.brand) == item.brand.strip().lower()
            ).first()

        # Resolve category
        category = None
        if item.category_id:
            category = db.query(Category).filter(Category.id == item.category_id).first()
        if not category and item.category_name:
            c_name = item.category_name.strip().lower()
            category = db.query(Category).filter(
                or_(
                    func.lower(Category.name) == c_name,
                    func.lower(Category.code) == c_name
                )
            ).first()
            
        if not category:
            category = db.query(Category).filter(
                or_(
                    func.lower(Category.name) == "others",
                    func.lower(Category.name) == "general",
                    func.lower(Category.name) == "consumables"
                )
            ).first()
            if not category:
                category = db.query(Category).first()
                
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No categories found in the database. Please add at least one category before importing products."
            )
            
        # Resolve brand
        brand_name_str = (item.brand or "Generic").strip()
        brand_rec = db.query(Brand).filter(
            or_(
                func.lower(Brand.name) == brand_name_str.lower(),
                func.upper(Brand.code) == brand_name_str.upper()
            )
        ).first()
        if not brand_rec:
            b_code = generate_unique_brand_code(db, brand_name_str)
            brand_rec = Brand(name=brand_name_str, code=b_code)
            db.add(brand_rec)
            db.commit()
            db.refresh(brand_rec)
            
        brand_code = brand_rec.code
        brand_name = brand_rec.name
        category_code = category.code or "GEN"
        category_name = category.name
        
        # Color resolution
        colour_val = (item.colour or "NA").strip()
        if colour_val.lower() in ["no", "none", "na", "not applicable"]:
            color_code, color_name = "NA", "Not Applicable"
        else:
            c_clean = colour_val.lower()
            if c_clean in COLOR_CODES:
                color_code, color_name = COLOR_CODES[c_clean], colour_val
            else:
                c_code = "".join([c for c in c_clean if c.isalnum()])[:2].upper()
                if len(c_code) < 2:
                    c_code = (c_code + "XX")[:2]
                color_code, color_name = c_code, colour_val

        # IF EXISTING PRODUCT MATCHED: UPDATE INSTEAD OF DUPLICATING
        if existing_product:
            if item.name and item.name.strip():
                existing_product.name = item.name.strip()
            existing_product.brand = brand_name
            existing_product.brand_name = brand_name
            existing_product.brand_code = brand_code
            existing_product.category_id = category.id
            existing_product.category_name = category_name
            existing_product.category_code = category_code
            if item.unit and item.unit.strip():
                existing_product.unit = item.unit.strip()
            if item.min_stock is not None:
                existing_product.min_stock = item.min_stock
            if item.unit_cost is not None and item.unit_cost >= 0:
                existing_product.unit_cost = item.unit_cost
            if item.description is not None:
                existing_product.description = item.description
            if colour_val and colour_val != "NA":
                existing_product.colour = color_name
                existing_product.color_name = color_name
                existing_product.color_code = color_code
                
            # If initial stock provided and no transactions exist for this product, add initial inward
            if init_stock_val > 0:
                has_tx = db.query(Transaction).filter(Transaction.product_id == existing_product.id).first()
                if not has_tx:
                    init_tx = Transaction(
                        product_id=existing_product.id,
                        type="inward",
                        quantity=init_stock_val,
                        user_id=current_user.id,
                        remarks="Initial Bulk Stock Setup via CSV Import",
                        supplier_name="Opening Stock Setup"
                    )
                    db.add(init_tx)

            created_products.append(existing_product)
            continue
                
        # Generate unique Barcode for NEW product
        current_serial += 1
        generated_code = f"VF-{brand_code}-{category_code}-{color_code}-{current_serial:06d}"
        
        exists_code = db.query(Product).filter(
            or_(
                Product.barcode == generated_code,
                Product.sku == generated_code
            )
        ).first()
        while exists_code or generated_code in batch_skus:
            current_serial += 1
            generated_code = f"VF-{brand_code}-{category_code}-{color_code}-{current_serial:06d}"
            exists_code = db.query(Product).filter(
                or_(
                    Product.barcode == generated_code,
                    Product.sku == generated_code
                )
            ).first()
            
        if item_sku:
            sku = item_sku
            batch_skus.add(sku)
            barcode = generated_code
        else:
            sku = generated_code
            barcode = generated_code
            batch_skus.add(sku)
            
        product = Product(
            sku=sku,
            name=item.name.strip(),
            brand=brand_name,
            category_id=category.id,
            unit=item.unit.strip() or "pcs",
            barcode=barcode,
            min_stock=item.min_stock,
            unit_cost=item.unit_cost,
            description=item.description,
            colour=color_name,
            brand_code=brand_code,
            brand_name=brand_name,
            category_code=category_code,
            category_name=category_name,
            color_code=color_code,
            color_name=color_name,
            global_serial=current_serial
        )
        db.add(product)
        db.flush() # get product.id before adding initial stock transaction
        
        if init_stock_val > 0:
            init_tx = Transaction(
                product_id=product.id,
                type="inward",
                quantity=init_stock_val,
                user_id=current_user.id,
                remarks="Initial Bulk Stock Setup via CSV Import",
                supplier_name="Opening Stock Setup"
            )
            db.add(init_tx)
            
        created_products.append(product)
        
    db.commit()
    
    # Refresh all objects and audit log
    response_list = []
    for prod in created_products:
        db.refresh(prod)
        response_list.append(make_product_response(db, prod))
        
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="BULK_CREATE_PRODUCTS",
        details=f"Bulk processed {len(created_products)} products via CSV/Excel (UPSERT)."
    )
    db.add(audit_entry)
    db.commit()
    
    return response_list

@router.post("/bulk-delete")
def bulk_delete_products(
    skus_in: BulkDeleteSKUs,
    current_user: User = Depends(get_master_user),  # Strict Master role only
    db: Session = Depends(get_db)
):
    deleted_skus = []
    for sku in skus_in.skus:
        product = db.query(Product).filter(Product.sku == sku).first()
        if product:
            db.delete(product)
            deleted_skus.append(sku)
            
    db.commit()
    
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="BULK_DELETE_PRODUCTS",
        details=f"Bulk deleted {len(deleted_skus)} products. SKUs: {', '.join(deleted_skus)}"
    )
    db.add(audit_entry)
    db.commit()
    
    return {"message": f"Successfully bulk deleted {len(deleted_skus)} products", "deleted_skus": deleted_skus}


