from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, date
from ..database import get_db
from ..models import Product, Transaction, Category, User, Customer
from ..schemas import InventoryStatus, DashboardMetrics
from ..auth import get_current_user
from .product_router import get_product_stock

router = APIRouter(prefix="/inventory", tags=["Inventory"])

def calculate_status(current: float, min_s: float) -> str:
    if current <= 0:
        return "critical"
    if min_s <= 0:
        return "healthy"
    if current <= 0.25 * min_s:
        return "critical"
    if current <= min_s:
        return "low"
    return "healthy"

@router.get("/status", response_model=List[InventoryStatus])
def get_inventory_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    products = db.query(Product).all()
    status_list = []
    
    for p in products:
        inward = db.query(func.sum(Transaction.quantity)).filter(
            Transaction.product_id == p.id,
            Transaction.type == "inward"
        ).scalar() or 0.0
        
        returned = db.query(func.sum(Transaction.quantity)).filter(
            Transaction.product_id == p.id,
            Transaction.type == "return"
        ).scalar() or 0.0
        
        outward = db.query(func.sum(Transaction.quantity)).filter(
            Transaction.product_id == p.id,
            Transaction.type == "outward"
        ).scalar() or 0.0
        
        current = float(inward + returned - outward)
        status = calculate_status(current, p.min_stock)
        
        status_list.append(
            InventoryStatus(
                product_id=p.id,
                sku=p.sku,
                name=p.name,
                brand=p.brand,
                category_name=p.category.name if p.category else "Unknown",
                unit=p.unit,
                barcode=p.barcode,
                min_stock=p.min_stock,
                unit_cost=p.unit_cost,
                total_inward=float(inward),
                total_outward=float(outward),
                total_returned=float(returned),
                current_stock=current,
                status=status
            )
        )
        
    return status_list

@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    products = db.query(Product).all()
    
    total_products = len(products)
    total_inventory = 0.0
    low_stock_count = 0
    inventory_value = 0.0
    reorder_recs = []
    
    for p in products:
        stock = get_product_stock(db, p.id)
        total_inventory += stock
        inventory_value += (stock * p.unit_cost)
        
        status = calculate_status(stock, p.min_stock)
        if status in ["low", "critical"]:
            low_stock_count += 1
            reorder_recs.append({
                "product_id": p.id,
                "sku": p.sku,
                "name": p.name,
                "brand": p.brand,
                "current_stock": stock,
                "min_stock": p.min_stock,
                "unit": p.unit,
                "status": status,
                "suggested_qty": float(max(p.min_stock * 2 - stock, p.min_stock))
            })
            
    # Today's inward/outward counts
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    today_inward = db.query(Transaction).filter(
        Transaction.type == "inward",
        Transaction.timestamp >= today_start,
        Transaction.timestamp <= today_end
    ).count()
    
    today_outward = db.query(Transaction).filter(
        Transaction.type == "outward",
        Transaction.timestamp >= today_start,
        Transaction.timestamp <= today_end
    ).count()
    
    # Recent Activities (recent 5 transactions)
    recent_txs = db.query(Transaction).order_by(Transaction.timestamp.desc()).limit(5).all()
    activities = []
    for tx in recent_txs:
        activities.append({
            "id": tx.id,
            "timestamp": tx.timestamp.isoformat(),
            "type": tx.type,
            "quantity": tx.quantity,
            "unit": tx.product.unit if tx.product else "units",
            "product_name": tx.product.name if tx.product else "Unknown",
            "user_fullname": tx.user.full_name if tx.user else "Unknown",
            "details": f"Received from {tx.supplier_name}" if tx.type == "inward" else f"Returned by {tx.customer.name if tx.customer else 'N/A'}" if tx.type == "return" else f"Issued to {tx.customer.name if tx.customer else tx.department or 'N/A'}"
        })
        
    # Category distribution
    categories = db.query(Category).all()
    category_dist = []
    for cat in categories:
        cat_products = db.query(Product).filter(Product.category_id == cat.id).all()
        cat_value = 0.0
        cat_cost = 0.0
        for p in cat_products:
            stock = get_product_stock(db, p.id)
            cat_value += stock
            cat_cost += (stock * p.unit_cost)
        if cat_value > 0 or cat_cost > 0:
            category_dist.append({
                "name": cat.name,
                "value": cat_value,
                "cost": cat_cost
            })

    # Weekly movement trend (last 7 days, including today)
    from datetime import timedelta
    weekly_movement = []
    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())
        
        inward_qty = db.query(func.sum(Transaction.quantity)).filter(
            Transaction.type.in_(["inward", "return"]),
            Transaction.timestamp >= day_start,
            Transaction.timestamp <= day_end
        ).scalar() or 0.0
        
        outward_qty = db.query(func.sum(Transaction.quantity)).filter(
            Transaction.type == "outward",
            Transaction.timestamp >= day_start,
            Transaction.timestamp <= day_end
        ).scalar() or 0.0
        
        weekly_movement.append({
            "name": day_date.strftime("%a"),
            "Inward": float(inward_qty),
            "Outward": float(outward_qty)
        })
        
    return DashboardMetrics(
        total_products=total_products,
        total_inventory=total_inventory,
        low_stock_count=low_stock_count,
        today_inward=today_inward,
        today_outward=today_outward,
        inventory_value=inventory_value,
        recent_activities=activities,
        reorder_recommendations=reorder_recs,
        category_distribution=category_dist,
        weekly_movement=weekly_movement
    )
