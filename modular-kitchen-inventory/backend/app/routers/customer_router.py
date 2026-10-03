from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from ..database import get_db
from ..models import Customer, User, AuditLog, Transaction, Product
from ..schemas import CustomerCreate, CustomerResponse
from ..auth import get_current_user, get_admin_user

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse])
def list_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all customers. Accessible to all logged-in users (including Staff for dropdowns)."""
    return db.query(Customer).order_by(Customer.name).all()

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    cust_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Add a new customer. Restricted to Admin and Master users."""
    # Check if a customer with the same name already exists
    existing = db.query(Customer).filter(Customer.name == cust_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with name '{cust_in.name}' already exists."
        )
    
    db_cust = Customer(
        name=cust_in.name,
        contact_person=cust_in.contact_person,
        email=cust_in.email,
        phone=cust_in.phone,
        address=cust_in.address
    )
    db.add(db_cust)
    db.commit()
    db.refresh(db_cust)
    
    # Log the action in AuditLogs
    audit = AuditLog(
        user_id=current_user.id,
        action="CUSTOMER_CREATED",
        details=f"Customer '{db_cust.name}' added to directory."
    )
    db.add(audit)
    db.commit()
    
    return db_cust

@router.get("/{customer_id}/invoice")
def get_customer_invoice(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Retrieve statement of goods usage for a specific customer. Restricted to Admin/Master."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    
    txs = db.query(Transaction).filter(
        Transaction.customer_id == customer_id,
        Transaction.type.in_(["outward", "return"])
    ).order_by(desc(Transaction.timestamp)).all()
    
    items = []
    summary_dict = {}
    
    for t in txs:
        items.append({
            "id": t.id,
            "product_name": t.product.name if t.product else "Unknown",
            "product_sku": t.product.sku if t.product else "Unknown",
            "product_barcode": t.product.barcode if t.product else "Unknown",
            "product_image_url": t.product.image_url if t.product else None,
            "transaction_image_url": t.image_url,
            "quantity": t.quantity,
            "type": t.type,
            "unit": t.product.unit if t.product else "pcs",
            "timestamp": t.timestamp.isoformat(),
            "operator": t.user.full_name if t.user else "Unknown",
            "remarks": t.remarks
        })
        
        # Calculate summary metrics grouped by product SKU
        if t.product:
            sku = t.product.sku
            if sku not in summary_dict:
                summary_dict[sku] = {
                    "product_name": t.product.name,
                    "product_sku": sku,
                    "product_barcode": t.product.barcode,
                    "product_image_url": t.product.image_url,
                    "total_issued": 0.0,
                    "total_returned": 0.0,
                    "net_consumed": 0.0,
                    "unit": t.product.unit
                }
            
            if t.type == "outward":
                summary_dict[sku]["total_issued"] += t.quantity
            elif t.type == "return":
                summary_dict[sku]["total_returned"] += t.quantity

    summary = []
    for sku, info in summary_dict.items():
        info["net_consumed"] = float(info["total_issued"] - info["total_returned"])
        summary.append(info)
        
    return {
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "contact_person": customer.contact_person,
            "email": customer.email,
            "phone": customer.phone,
            "address": customer.address
        },
        "items": items,
        "summary": summary
    }
