from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func, and_
from typing import List, Optional
from datetime import datetime
import os
import shutil
import uuid
from ..database import get_db, STORAGE_DIR
from ..models import Transaction, Product, User, AuditLog, Customer, Category, Brand
from ..schemas import (
    TransactionResponse,
    TransactionCreateInward,
    TransactionCreateOutward,
    BulkTransactionCreateInward,
    BulkTransactionCreateOutward,
    BulkTransactionCreateReturn,
    StockAdjustmentRequest,
)
from ..auth import get_current_user
from .product_router import get_product_stock
from ..utils.email_utils import send_transaction_email
from ..websocket_manager import broadcast_refresh

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/upload-image")
def upload_transaction_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
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
    filename = f"tx_{uuid.uuid4().hex}{ext}"
    uploads_dir = os.path.join(STORAGE_DIR, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_path = os.path.join(uploads_dir, filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"image_url": f"/static/uploads/{filename}"}

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    product_id: Optional[int] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).join(Product).join(User).outerjoin(Customer)
    
    if product_id:
        query = query.filter(Transaction.product_id == product_id)
        
    if type:
        query = query.filter(Transaction.type == type)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_filter),
                Product.sku.ilike(search_filter),
                Product.barcode.ilike(search_filter),
                Transaction.supplier_name.ilike(search_filter),
                Transaction.invoice_number.ilike(search_filter),
                Transaction.department.ilike(search_filter),
                Transaction.remarks.ilike(search_filter),
                Customer.name.ilike(search_filter)
            )
        )
        
    transactions = query.order_by(desc(Transaction.timestamp)).all()
    
    response_list = []
    for t in transactions:
        response_list.append(
            TransactionResponse(
                id=t.id,
                product_id=t.product_id,
                product_name=t.product.name if t.product else "Unknown",
                product_sku=t.product.sku if t.product else "Unknown",
                type=t.type,
                quantity=t.quantity,
                user_id=t.user_id,
                user_fullname=t.user.full_name if t.user else "Unknown",
                timestamp=t.timestamp,
                supplier_name=t.supplier_name,
                invoice_number=t.invoice_number,
                department=t.department,
                customer_id=t.customer_id,
                customer_name=t.customer.name if t.customer else None,
                remarks=t.remarks,
                image_url=t.image_url
            )
        )
        
    return response_list

def handle_automatic_glue_consumption(db: Session, product: Product, quantity: float, customer_id: int, remarks: str, image_url: str, user_id: int, background_tasks: BackgroundTasks):
    if (product.category_code == "PW") or (product.category and product.category.name == "Plywood"):
        # Find or create Euro EWR Max Glue under the new SKU system (EU brand, AD category)
        glue = db.query(Product).filter(
            or_(
                Product.sku == "MK-ADH-002",
                and_(Product.brand_code == "EU", Product.category_code == "AD")
            )
        ).first()
        if not glue:
            cat = db.query(Category).filter(Category.name == "Adhesives").first()
            if not cat:
                cat = Category(name="Adhesives", code="AD", description="Synthetic wood adhesives")
                db.add(cat)
                db.flush()
            else:
                if not cat.code:
                    cat.code = "AD"
                    db.flush()
                    
            brand_rec = db.query(Brand).filter(Brand.code == "EU").first()
            if not brand_rec:
                brand_rec = Brand(name="Euro", code="EU")
                db.add(brand_rec)
                db.flush()
                
            max_serial = db.query(func.max(Product.global_serial)).scalar() or 0
            global_serial = max_serial + 1
            sku = f"VF-EU-AD-NA-{global_serial:06d}"
            
            glue = Product(
                sku=sku,
                name="Euro EWR Max Glue",
                brand="Euro",
                category_id=cat.id,
                unit="kg",
                barcode=sku,
                min_stock=50.0,
                unit_cost=0.0,
                description="Euro EWR Max Glue 50kg drum",
                colour="no",
                brand_code="EU",
                brand_name="Euro",
                category_code="AD",
                category_name="Adhesives",
                color_code="NA",
                color_name="Not Applicable",
                global_serial=global_serial
            )
            db.add(glue)
            db.flush()
            
        glue_qty = 1.5 * quantity
        
        # Verify glue stock level
        glue_stock = get_product_stock(db, glue.id)
        is_low_glue = glue_stock < glue_qty
        
        glue_remarks = f"Auto-applied glue (1.5kg/sheet) for Plywood '{product.sku}' issue."
        if is_low_glue:
            glue_remarks = f"[STOCK SHORTAGE ALERT: Insufficient glue stock ({glue_stock} kg left, requested {glue_qty} kg)] {glue_remarks}"
        if remarks:
            glue_remarks = f"{glue_remarks} | Plywood remarks: {remarks}"
            
        glue_tx = Transaction(
            product_id=glue.id,
            type="outward",
            quantity=glue_qty,
            user_id=user_id,
            customer_id=customer_id,
            remarks=glue_remarks.strip(),
            image_url=image_url
        )
        db.add(glue_tx)
        db.flush()
        
        # Audit log
        audit_details = f"Automatically consumed {glue_qty} kg of Euro EWR Max Glue (SKU: {glue.sku}) for plywood issue."
        if is_low_glue:
            audit_details = f"[WARNING: GLUE SHORTAGE] {audit_details} Current stock: {glue_stock} kg."
        audit = AuditLog(
            user_id=user_id,
            action="OUTWARD_TRANSACTION",
            details=audit_details
        )
        db.add(audit)

def handle_automatic_glue_return(db: Session, product: Product, quantity: float, customer_id: int, remarks: str, image_url: str, user_id: int, background_tasks: BackgroundTasks):
    if (product.category_code == "PW") or (product.category and product.category.name == "Plywood"):
        # Find Euro EWR Max Glue under the new SKU system (EU brand, AD category)
        glue = db.query(Product).filter(
            or_(
                Product.sku == "MK-ADH-002",
                and_(Product.brand_code == "EU", Product.category_code == "AD")
            )
        ).first()
        if not glue:
            return
            
        glue_qty = 1.5 * quantity
        
        glue_remarks = f"Auto-returned glue (1.5kg/sheet) for returned Plywood '{product.sku}'."
        if remarks:
            glue_remarks = f"{glue_remarks} | Plywood remarks: {remarks}"
            
        glue_tx = Transaction(
            product_id=glue.id,
            type="return",
            quantity=glue_qty,
            user_id=user_id,
            customer_id=customer_id,
            remarks=glue_remarks.strip(),
            image_url=image_url
        )
        db.add(glue_tx)
        db.flush()
        
        # Audit log
        audit_details = f"Automatically returned {glue_qty} kg of Euro EWR Max Glue (SKU: {glue.sku}) due to plywood return."
        audit = AuditLog(
            user_id=user_id,
            action="RETURN_TRANSACTION",
            details=audit_details
        )
        db.add(audit)

@router.post("/inward", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def record_inward(
    tx_in: TransactionCreateInward,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find product by barcode or SKU
    product = db.query(Product).filter(
        or_(
            Product.barcode == tx_in.product_barcode_or_sku,
            Product.sku == tx_in.product_barcode_or_sku
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found. Verify SKU or barcode.")
        
    if tx_in.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero.")
        
    tx = Transaction(
        product_id=product.id,
        type="inward",
        quantity=tx_in.quantity,
        user_id=current_user.id,
        supplier_name=tx_in.supplier_name,
        invoice_number=tx_in.invoice_number,
        remarks=tx_in.remarks
    )
    
    db.add(tx)
    db.commit()
    db.refresh(tx)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="INWARD_TRANSACTION",
        details=f"Inward stock added: {tx.quantity} {product.unit} of '{product.name}' (SKU: {product.sku}) from '{tx.supplier_name or 'N/A'}'."
    )
    db.add(audit)
    db.commit()
    
    # Trigger background email alert
    current_stock = get_product_stock(db, product.id)
    tx_details = {
        "timestamp": tx.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "product_name": product.name,
        "sku": product.sku,
        "barcode": product.barcode,
        "quantity": tx.quantity,
        "unit": product.unit,
        "operator": current_user.full_name,
        "supplier_name": tx.supplier_name,
        "invoice_number": tx.invoice_number,
        "remarks": tx.remarks,
        "image_url": product.image_url,
        "current_stock": current_stock,
        "min_stock": product.min_stock
    }
    background_tasks.add_task(send_transaction_email, "inward", tx_details)
    background_tasks.add_task(broadcast_refresh)
    
    return TransactionResponse(
        id=tx.id,
        product_id=tx.product_id,
        product_name=product.name,
        product_sku=product.sku,
        type=tx.type,
        quantity=tx.quantity,
        user_id=tx.user_id,
        user_fullname=current_user.full_name,
        timestamp=tx.timestamp,
        supplier_name=tx.supplier_name,
        invoice_number=tx.invoice_number,
        department=None,
        remarks=tx.remarks,
        image_url=tx.image_url
    )

@router.post("/inward/bulk", response_model=List[TransactionResponse], status_code=status.HTTP_201_CREATED)
def record_inward_bulk(
    bulk_in: BulkTransactionCreateInward,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not bulk_in.items:
        raise HTTPException(status_code=400, detail="At least one product item must be provided.")
        
    created_txs = []
    
    try:
        for item in bulk_in.items:
            product = db.query(Product).filter(
                or_(
                    func.lower(Product.barcode) == item.product_barcode_or_sku.lower(),
                    func.lower(Product.sku) == item.product_barcode_or_sku.lower()
                )
            ).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product with barcode/SKU '{item.product_barcode_or_sku}' not found.")
                
            if item.quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Quantity for '{product.name}' must be greater than zero.")
                
            tx = Transaction(
                product_id=product.id,
                type="inward",
                quantity=item.quantity,
                user_id=current_user.id,
                supplier_name=bulk_in.supplier_name,
                invoice_number=bulk_in.invoice_number,
                remarks=item.remarks or bulk_in.remarks,
                image_url=bulk_in.image_url
            )
            db.add(tx)
            db.flush()
            
            # Audit log
            audit = AuditLog(
                user_id=current_user.id,
                action="INWARD_TRANSACTION",
                details=f"Bulk Inward stock added: {tx.quantity} {product.unit} of '{product.name}' (SKU: {product.sku}) from '{tx.supplier_name or 'N/A'}'."
            )
            db.add(audit)
            
            current_stock = get_product_stock(db, product.id)
            tx_details = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "product_name": product.name,
                "sku": product.sku,
                "barcode": product.barcode,
                "quantity": tx.quantity,
                "unit": product.unit,
                "operator": current_user.full_name,
                "supplier_name": tx.supplier_name,
                "invoice_number": tx.invoice_number,
                "remarks": tx.remarks,
                "image_url": bulk_in.image_url or product.image_url,
                "current_stock": current_stock,
                "min_stock": product.min_stock
            }
            background_tasks.add_task(send_transaction_email, "inward", tx_details)
            
            created_txs.append((tx, product))
            
        db.commit()
        background_tasks.add_task(broadcast_refresh)
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database transaction failed: {str(e)}")
        
    response_list = []
    for tx, product in created_txs:
        db.refresh(tx)
        response_list.append(
            TransactionResponse(
                id=tx.id,
                product_id=tx.product_id,
                product_name=product.name,
                product_sku=product.sku,
                type=tx.type,
                quantity=tx.quantity,
                user_id=tx.user_id,
                user_fullname=current_user.full_name,
                timestamp=tx.timestamp,
                supplier_name=tx.supplier_name,
                invoice_number=tx.invoice_number,
                department=None,
                remarks=tx.remarks,
                image_url=tx.image_url
            )
        )
    return response_list

@router.post("/outward", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def record_outward(
    tx_out: TransactionCreateOutward,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find product by barcode or SKU
    product = db.query(Product).filter(
        or_(
            func.lower(Product.barcode) == tx_out.product_barcode_or_sku.lower(),
            func.lower(Product.sku) == tx_out.product_barcode_or_sku.lower()
        )
    ).with_for_update().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found. Verify SKU or barcode.")
        
    if tx_out.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero.")
        
    # Check if customer exists
    customer = db.query(Customer).filter(Customer.id == tx_out.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found. Select a valid customer.")
        
    # Check current stock to prevent negative inventory
    current_stock = get_product_stock(db, product.id)
    if current_stock < tx_out.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Product '{product.name}' current stock is {current_stock} {product.unit}, requested {tx_out.quantity} {product.unit}."
        )
        
    tx = Transaction(
        product_id=product.id,
        type="outward",
        quantity=tx_out.quantity,
        user_id=current_user.id,
        customer_id=tx_out.customer_id,
        remarks=tx_out.remarks,
        image_url=tx_out.image_url
    )
    
    db.add(tx)
    db.commit()
    db.refresh(tx)
    
    # Auto glue consumption
    handle_automatic_glue_consumption(db, product, tx_out.quantity, tx_out.customer_id, tx_out.remarks, tx_out.image_url, current_user.id, background_tasks)
    db.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="OUTWARD_TRANSACTION",
        details=f"Outward stock consumed: {tx.quantity} {product.unit} of '{product.name}' (SKU: {product.sku}) by customer '{customer.name}'."
    )
    db.add(audit)
    db.commit()
    
    # Trigger background email alert
    current_stock = get_product_stock(db, product.id)
    tx_details = {
        "timestamp": tx.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "product_name": product.name,
        "sku": product.sku,
        "barcode": product.barcode,
        "quantity": tx.quantity,
        "unit": product.unit,
        "operator": current_user.full_name,
        "customer_name": customer.name,
        "customer_phone": customer.phone,
        "customer_email": customer.email,
        "customer_address": customer.address,
        "remarks": tx.remarks,
        "image_url": tx.image_url or product.image_url,
        "base_url": str(request.base_url).rstrip('/'),
        "current_stock": current_stock,
        "min_stock": product.min_stock
    }
    background_tasks.add_task(send_transaction_email, "outward", tx_details)
    background_tasks.add_task(broadcast_refresh)
    
    return TransactionResponse(
        id=tx.id,
        product_id=tx.product_id,
        product_name=product.name,
        product_sku=product.sku,
        type=tx.type,
        quantity=tx.quantity,
        user_id=tx.user_id,
        user_fullname=current_user.full_name,
        timestamp=tx.timestamp,
        supplier_name=None,
        invoice_number=None,
        department=None,
        customer_id=tx.customer_id,
        customer_name=customer.name,
        remarks=tx.remarks,
        image_url=tx.image_url
    )

@router.post("/outward/bulk", response_model=List[TransactionResponse], status_code=status.HTTP_201_CREATED)
def record_outward_bulk(
    bulk_out: BulkTransactionCreateOutward,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not bulk_out.items:
        raise HTTPException(status_code=400, detail="At least one product item must be provided.")
        
    customer = db.query(Customer).filter(Customer.id == bulk_out.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found. Select a valid customer.")
        
    created_txs = []
    
    try:
        for item in bulk_out.items:
            product = db.query(Product).filter(
                or_(
                    func.lower(Product.barcode) == item.product_barcode_or_sku.lower(),
                    func.lower(Product.sku) == item.product_barcode_or_sku.lower()
                )
            ).with_for_update().first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product with barcode/SKU '{item.product_barcode_or_sku}' not found.")
                
            if item.quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Quantity for '{product.name}' must be greater than zero.")
                
            # Check current stock
            current_stock = get_product_stock(db, product.id)
            if current_stock < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{product.name}'. Current stock is {current_stock} {product.unit}, requested {item.quantity} {product.unit}."
                )
                
            tx = Transaction(
                product_id=product.id,
                type="outward",
                quantity=item.quantity,
                user_id=current_user.id,
                customer_id=bulk_out.customer_id,
                remarks=item.remarks or bulk_out.remarks,
                image_url=item.image_url
            )
            db.add(tx)
            db.flush()
            
            # Auto glue consumption
            handle_automatic_glue_consumption(db, product, item.quantity, bulk_out.customer_id, item.remarks or bulk_out.remarks, item.image_url, current_user.id, background_tasks)
            
            # Audit log
            audit = AuditLog(
                user_id=current_user.id,
                action="OUTWARD_TRANSACTION",
                details=f"Bulk Outward stock consumed: {tx.quantity} {product.unit} of '{product.name}' (SKU: {product.sku}) by customer '{customer.name}'."
            )
            db.add(audit)
            
            current_stock = get_product_stock(db, product.id)
            tx_details = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "product_name": product.name,
                "sku": product.sku,
                "barcode": product.barcode,
                "quantity": tx.quantity,
                "unit": product.unit,
                "operator": current_user.full_name,
                "customer_name": customer.name,
                "customer_phone": customer.phone,
                "customer_email": customer.email,
                "customer_address": customer.address,
                "remarks": tx.remarks,
                "image_url": item.image_url or product.image_url,
                "base_url": str(request.base_url).rstrip('/'),
                "current_stock": current_stock,
                "min_stock": product.min_stock
            }
            background_tasks.add_task(send_transaction_email, "outward", tx_details)
            
            created_txs.append((tx, product))
            
        db.commit()
        background_tasks.add_task(broadcast_refresh)
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database transaction failed: {str(e)}")
        
    response_list = []
    for tx, product in created_txs:
        db.refresh(tx)
        response_list.append(
            TransactionResponse(
                id=tx.id,
                product_id=tx.product_id,
                product_name=product.name,
                product_sku=product.sku,
                type=tx.type,
                quantity=tx.quantity,
                user_id=tx.user_id,
                user_fullname=current_user.full_name,
                timestamp=tx.timestamp,
                supplier_name=None,
                invoice_number=None,
                department=None,
                customer_id=tx.customer_id,
                customer_name=customer.name,
                remarks=tx.remarks,
                image_url=tx.image_url
            )
        )
    return response_list

@router.post("/return/bulk", response_model=List[TransactionResponse], status_code=status.HTTP_201_CREATED)
def record_return_bulk(
    bulk_ret: BulkTransactionCreateReturn,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not bulk_ret.items:
        raise HTTPException(status_code=400, detail="At least one product item must be provided.")
        
    customer = db.query(Customer).filter(Customer.id == bulk_ret.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found. Select a valid customer.")
        
    created_txs = []
    
    try:
        for item in bulk_ret.items:
            product = db.query(Product).filter(
                or_(
                    func.lower(Product.barcode) == item.product_barcode_or_sku.lower(),
                    func.lower(Product.sku) == item.product_barcode_or_sku.lower()
                )
            ).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product with barcode/SKU '{item.product_barcode_or_sku}' not found.")
                
            if item.quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Quantity for '{product.name}' must be greater than zero.")
                
            tx = Transaction(
                product_id=product.id,
                type="return",
                quantity=item.quantity,
                user_id=current_user.id,
                customer_id=bulk_ret.customer_id,
                remarks=item.remarks or bulk_ret.remarks,
                image_url=item.image_url
            )
            db.add(tx)
            db.flush()
            
            # Audit log
            audit = AuditLog(
                user_id=current_user.id,
                action="RETURN_TRANSACTION",
                details=f"Stock returned: {tx.quantity} {product.unit} of '{product.name}' (SKU: {product.sku}) by customer '{customer.name}'."
            )
            db.add(audit)
            
            # Auto glue return
            handle_automatic_glue_return(db, product, item.quantity, bulk_ret.customer_id, item.remarks or bulk_ret.remarks, item.image_url, current_user.id, background_tasks)
            
            current_stock = get_product_stock(db, product.id)
            tx_details = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "product_name": product.name,
                "sku": product.sku,
                "barcode": product.barcode,
                "quantity": tx.quantity,
                "unit": product.unit,
                "operator": current_user.full_name,
                "customer_name": customer.name,
                "customer_phone": customer.phone,
                "customer_email": customer.email,
                "customer_address": customer.address,
                "remarks": tx.remarks,
                "image_url": item.image_url or product.image_url,
                "base_url": str(request.base_url).rstrip('/'),
                "current_stock": current_stock,
                "min_stock": product.min_stock
            }
            background_tasks.add_task(send_transaction_email, "return", tx_details)
            
            created_txs.append((tx, product))
            
        db.commit()
        background_tasks.add_task(broadcast_refresh)
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database transaction failed: {str(e)}")
        
    response_list = []
    for tx, product in created_txs:
      db.refresh(tx)
      response_list.append(
          TransactionResponse(
              id=tx.id,
              product_id=tx.product_id,
              product_name=product.name,
              product_sku=product.sku,
              type=tx.type,
              quantity=tx.quantity,
              user_id=tx.user_id,
              user_fullname=current_user.full_name,
              timestamp=tx.timestamp,
              supplier_name=None,
              invoice_number=None,
              department=None,
              customer_id=tx.customer_id,
              customer_name=customer.name,
              remarks=tx.remarks,
              image_url=tx.image_url
          )
      )
    return response_list

@router.post("/adjust-stock", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def adjust_stock(
    req: StockAdjustmentRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only allow "master" username
    if current_user.username != "master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the Master Admin can perform direct stock adjustments."
        )
        
    if req.type not in ["inward", "outward"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Adjustment type must be 'inward' or 'outward'."
        )
        
    if req.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero."
        )
        
    product = db.query(Product).filter(Product.id == req.product_id).with_for_update().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    # Check current stock if doing outward adjustment
    if req.type == "outward":
        current_stock = get_product_stock(db, product.id)
        if current_stock < req.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for adjustment. Current: {current_stock}, requested reduction: {req.quantity}."
            )
            
    tx = Transaction(
        product_id=product.id,
        type=req.type,
        quantity=req.quantity,
        user_id=current_user.id,
        remarks=req.remarks or "Trial stock correction (Master Adjustment)"
    )
    
    db.add(tx)
    
    # Audit log entry
    audit = AuditLog(
        user_id=current_user.id,
        action="STOCK_ADJUSTMENT",
        details=f"Master adjusted stock for {product.name} ({product.sku}): type={req.type}, quantity={req.quantity}"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(tx)
    
    # Broadcast refresh using WebSockets
    background_tasks.add_task(broadcast_refresh)
    
    return TransactionResponse(
        id=tx.id,
        product_id=tx.product_id,
        product_name=product.name,
        product_sku=product.sku,
        type=tx.type,
        quantity=tx.quantity,
        user_id=tx.user_id,
        user_fullname=current_user.full_name,
        timestamp=tx.timestamp,
        supplier_name=None,
        invoice_number=None,
        department=None,
        customer_id=None,
        customer_name=None,
        remarks=tx.remarks,
        image_url=None
    )

@router.post("/reset", status_code=status.HTTP_200_OK)
def reset_transaction_history(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only allow "master" username
    if current_user.username != "master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the Master Admin can reset the transaction history."
        )
        
    try:
        # Delete all transactions
        db.query(Transaction).delete()
        
        # Log this reset in AuditLog
        audit = AuditLog(
            user_id=current_user.id,
            action="RESET_TRANSACTIONS",
            details="Master Admin reset the entire transaction history."
        )
        db.add(audit)
        
        db.commit()
        
        # Broadcast refresh using WebSockets
        background_tasks.add_task(broadcast_refresh)
        
        return {"message": "Transaction history reset successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset transaction history: {str(e)}")

