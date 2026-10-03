import io
import csv
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import Product, Transaction, User
from ..auth import get_current_user, get_admin_user
from .product_router import get_product_stock
from .inventory_router import calculate_status

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/stock/export")
def export_stock_report(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["SKU", "Product Name", "Brand", "Category", "Unit", "Barcode", "Min Stock", "Unit Cost (₹)", "Current Stock", "Total Stock Value (₹)", "Status"])
    
    grand_total_qty = 0.0
    grand_total_val = 0.0
    
    products = db.query(Product).all()
    for p in products:
        stock = get_product_stock(db, p.id)
        val = stock * p.unit_cost
        status = calculate_status(stock, p.min_stock)
        
        grand_total_qty += stock
        grand_total_val += val
        
        writer.writerow([
            p.sku,
            p.name,
            p.brand,
            p.category.name if p.category else "N/A",
            p.unit,
            p.barcode,
            p.min_stock,
            p.unit_cost,
            stock,
            round(val, 2),
            status.upper()
        ])
        
    writer.writerow([])
    writer.writerow(["TOTAL SUMMARY", f"{len(products)} Products", "", "", "", "", "", "GRAND TOTAL VALUE:", grand_total_qty, round(grand_total_val, 2), ""])

    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=stock_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return response

@router.get("/inward/export")
def export_inward_report(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Transaction ID", "Date/Time", "SKU", "Product Name", "Quantity", "Unit", "User", "Supplier", "Invoice Number", "Remarks"])
    
    txs = db.query(Transaction).filter(Transaction.type == "inward").order_by(Transaction.timestamp.desc()).all()
    for t in txs:
        writer.writerow([
            t.id,
            t.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            t.product.sku if t.product else "N/A",
            t.product.name if t.product else "N/A",
            t.quantity,
            t.product.unit if t.product else "N/A",
            t.user.full_name if t.user else "N/A",
            t.supplier_name or "",
            t.invoice_number or "",
            t.remarks or ""
        ])
        
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=inward_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return response

@router.get("/outward/export")
def export_outward_report(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Transaction ID", "Date/Time", "SKU", "Product Name", "Quantity", "Unit", "User", "Customer", "Department", "Remarks"])
    
    txs = db.query(Transaction).filter(Transaction.type == "outward").order_by(Transaction.timestamp.desc()).all()
    for t in txs:
        writer.writerow([
            t.id,
            t.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            t.product.sku if t.product else "N/A",
            t.product.name if t.product else "N/A",
            t.quantity,
            t.product.unit if t.product else "N/A",
            t.user.full_name if t.user else "N/A",
            t.customer.name if t.customer else "N/A",
            t.department or "",
            t.remarks or ""
        ])
        
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=outward_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return response

@router.get("/lowstock/export")
def export_lowstock_report(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["SKU", "Product Name", "Brand", "Category", "Unit", "Min Stock", "Current Stock", "Status"])
    
    products = db.query(Product).all()
    for p in products:
        stock = get_product_stock(db, p.id)
        status = calculate_status(stock, p.min_stock)
        
        if status in ["low", "critical"]:
            writer.writerow([
                p.sku,
                p.name,
                p.brand,
                p.category.name if p.category else "N/A",
                p.unit,
                p.min_stock,
                stock,
                status.upper()
            ])
            
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=lowstock_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return response
