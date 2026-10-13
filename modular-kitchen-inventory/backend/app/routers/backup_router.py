import io
import os
import csv
import zipfile
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db, STORAGE_DIR
from ..models import Product, Transaction, User, Category, Brand, Supplier, Customer, AuditLog
from ..auth import get_master_user
from .product_router import get_product_stock

router = APIRouter(prefix="/backup", tags=["Backup"])


@router.post("/reset-inventory")
def reset_inventory(
    clear_products: bool = Query(True, description="If true, also deletes all products. If false, only clears transaction history."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_master_user)  # Master role only
):
    """
    ⚠️ DANGER ZONE – Master Admin Only.
    Wipes all inventory stock data to allow a clean re-import from a fresh CSV.
    
    - `clear_products=true` (default): Deletes ALL transactions AND ALL products (full factory reset).
    - `clear_products=false`: Deletes only transaction history (stock becomes 0), products remain.
    """
    deleted_transactions = db.query(Transaction).delete(synchronize_session=False)
    db.commit()
    
    deleted_products = 0
    if clear_products:
        deleted_products = db.query(Product).delete(synchronize_session=False)
        db.commit()

    # Log the action
    audit = AuditLog(
        user_id=current_user.id,
        action="RESET_INVENTORY",
        details=(
            f"Master reset performed by {current_user.username}. "
            f"Deleted {deleted_transactions} transactions, {deleted_products} products. "
            f"clear_products={clear_products}"
        )
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": (
            f"Inventory reset complete. Deleted {deleted_transactions} transaction records"
            + (f" and {deleted_products} products." if clear_products else ". Products catalog retained.")
        ),
        "deleted_transactions": deleted_transactions,
        "deleted_products": deleted_products,
        "clear_products": clear_products
    }

@router.get("/download")
def download_full_system_backup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_master_user)  # Master role only
):
    """
    Master Admin full system backup:
    Compresses all database records into structured CSV sheets and includes all uploaded photos into a single downloadable .zip archive.
    """
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # 1. Products Catalog CSV
        prod_output = io.StringIO()
        prod_writer = csv.writer(prod_output)
        prod_writer.writerow([
            "ID", "SKU", "Product Name", "Brand", "Category", "Unit", "Barcode", 
            "Min Stock", "Unit Cost", "Current Stock", "Colour", "Description", "Image URL", "Created At"
        ])
        products = db.query(Product).all()
        for p in products:
            stock = get_product_stock(db, p.id)
            prod_writer.writerow([
                p.id, p.sku, p.name, p.brand,
                p.category.name if p.category else "N/A",
                p.unit, p.barcode, p.min_stock, p.unit_cost, stock,
                p.colour, p.description or "", p.image_url or "",
                p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else ""
            ])
        zip_file.writestr("Data_Backup/Products_Catalog.csv", prod_output.getvalue())

        # 2. Transactions History CSV
        tx_output = io.StringIO()
        tx_writer = csv.writer(tx_output)
        tx_writer.writerow([
            "Transaction ID", "Date/Time", "Type", "Product ID", "SKU", "Product Name",
            "Quantity", "Unit", "User", "Supplier Name", "Invoice Number", "Department",
            "Customer ID", "Customer Name", "Remarks", "Attached Photo URL"
        ])
        transactions = db.query(Transaction).order_by(Transaction.timestamp.desc()).all()
        for t in transactions:
            tx_writer.writerow([
                t.id,
                t.timestamp.strftime("%Y-%m-%d %H:%M:%S") if t.timestamp else "",
                t.type, t.product_id,
                t.product.sku if t.product else "",
                t.product.name if t.product else "",
                t.quantity,
                t.product.unit if t.product else "",
                t.user.full_name if t.user else "",
                t.supplier_name or "",
                t.invoice_number or "",
                t.department or "",
                t.customer_id or "",
                t.customer.name if t.customer else "",
                t.remarks or "",
                t.image_url or ""
            ])
        zip_file.writestr("Data_Backup/Transactions_History.csv", tx_output.getvalue())

        # 3. Categories CSV
        cat_output = io.StringIO()
        cat_writer = csv.writer(cat_output)
        cat_writer.writerow(["ID", "Category Name", "Category Code", "Description"])
        categories = db.query(Category).all()
        for c in categories:
            cat_writer.writerow([c.id, c.name, c.code or "", c.description or ""])
        zip_file.writestr("Data_Backup/Categories.csv", cat_output.getvalue())

        # 4. Brands CSV
        brand_output = io.StringIO()
        brand_writer = csv.writer(brand_output)
        brand_writer.writerow(["ID", "Brand Name", "Brand Code"])
        brands = db.query(Brand).all()
        for b in brands:
            brand_writer.writerow([b.id, b.name, b.code or ""])
        zip_file.writestr("Data_Backup/Brands.csv", brand_output.getvalue())

        # 5. Suppliers CSV
        supp_output = io.StringIO()
        supp_writer = csv.writer(supp_output)
        supp_writer.writerow(["ID", "Supplier Name", "Contact Person", "Email", "Phone", "Address"])
        suppliers = db.query(Supplier).all()
        for s in suppliers:
            supp_writer.writerow([s.id, s.name, s.contact_person or "", s.email or "", s.phone or "", s.address or ""])
        zip_file.writestr("Data_Backup/Suppliers.csv", supp_output.getvalue())

        # 6. Customers CSV
        cust_output = io.StringIO()
        cust_writer = csv.writer(cust_output)
        cust_writer.writerow(["ID", "Customer Name", "Contact Person", "Email", "Phone", "Address"])
        customers = db.query(Customer).all()
        for c in customers:
            cust_writer.writerow([c.id, c.name, c.contact_person or "", c.email or "", c.phone or "", c.address or ""])
        zip_file.writestr("Data_Backup/Customers.csv", cust_output.getvalue())

        # 7. Audit Logs CSV
        audit_output = io.StringIO()
        audit_writer = csv.writer(audit_output)
        audit_writer.writerow(["ID", "Timestamp", "User", "Action", "Details"])
        audit_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
        for a in audit_logs:
            audit_writer.writerow([
                a.id,
                a.timestamp.strftime("%Y-%m-%d %H:%M:%S") if a.timestamp else "",
                a.user.full_name if a.user else "",
                a.action,
                a.details or ""
            ])
        zip_file.writestr("Data_Backup/Audit_Logs.csv", audit_output.getvalue())

        # 8. Uploaded Photographs & Documents
        uploads_dir = os.path.join(STORAGE_DIR, "uploads")
        if os.path.exists(uploads_dir):
            for root_path, _, files in os.walk(uploads_dir):
                for file_name in files:
                    full_file_path = os.path.join(root_path, file_name)
                    rel_path = os.path.relpath(full_file_path, uploads_dir)
                    zip_file.write(full_file_path, arcname=f"Uploaded_Photos/{rel_path}")

    zip_buffer.seek(0)
    filename = f"VUDFIT_Master_Full_System_Backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    
    response = StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
    return response
