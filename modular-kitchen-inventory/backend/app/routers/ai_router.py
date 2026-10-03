from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional
from ..database import get_db
from ..models import Product, Category, Transaction, User
from ..schemas import AIQueryRequest, AIQueryResponse
from ..auth import get_current_user
from .product_router import get_product_stock
from .inventory_router import calculate_status

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

@router.post("/query", response_model=AIQueryResponse)
def query_assistant(request: AIQueryRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = request.query.lower().strip()
    
    # 1. Show low stock items
    if any(keyword in q for keyword in ["low stock", "below minimum", "reorder", "critical stock", "low-stock"]):
        products = db.query(Product).all()
        low_stock_items = []
        for p in products:
            stock = get_product_stock(db, p.id)
            status = calculate_status(stock, p.min_stock)
            if status in ["low", "critical"]:
                low_stock_items.append({
                    "sku": p.sku,
                    "name": p.name,
                    "brand": p.brand,
                    "current_stock": stock,
                    "min_stock": p.min_stock,
                    "unit": p.unit,
                    "status": status
                })
                
        if not low_stock_items:
            return AIQueryResponse(
                answer="Great news! All inventory levels are healthy. No items are currently low on stock.",
                data_type="products",
                data=[]
            )
            
        details = ", ".join([f"{item['name']} ({item['current_stock']} {item['unit']} available, min: {item['min_stock']})" for item in low_stock_items])
        answer = f"There are {len(low_stock_items)} items running low on stock: {details}."
        return AIQueryResponse(answer=answer, data_type="products", data=low_stock_items)
        
    # 2. What was consumed today / what was used today / outward today
    if any(keyword in q for keyword in ["consumed today", "used today", "outward today", "issued today", "manufacturing today"]):
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        txs = db.query(Transaction).filter(
            Transaction.type == "outward",
            Transaction.timestamp >= today_start,
            Transaction.timestamp <= today_end
        ).all()
        
        if not txs:
            return AIQueryResponse(
                answer="No inventory was consumed or issued for manufacturing today.",
                data_type="transactions",
                data=[]
            )
            
        lines = []
        tx_data = []
        for tx in txs:
            lines.append(f"{tx.quantity} {tx.product.unit} of {tx.product.name} issued to {tx.department or 'N/A'}")
            tx_data.append({
                "id": tx.id,
                "timestamp": tx.timestamp.isoformat(),
                "sku": tx.product.sku if tx.product else "N/A",
                "product_name": tx.product.name if tx.product else "Unknown",
                "quantity": tx.quantity,
                "unit": tx.product.unit if tx.product else "N/A",
                "user": tx.user.full_name if tx.user else "Unknown",
                "details": f"Issued to {tx.department or 'Production'}"
            })
            
        answer = f"Today's consumption includes: " + "; ".join(lines) + "."
        return AIQueryResponse(answer=answer, data_type="transactions", data=tx_data)

    # 3. What was received today / inward today
    if any(keyword in q for keyword in ["received today", "inward today", "incoming today", "arrived today"]):
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        txs = db.query(Transaction).filter(
            Transaction.type == "inward",
            Transaction.timestamp >= today_start,
            Transaction.timestamp <= today_end
        ).all()
        
        if not txs:
            return AIQueryResponse(
                answer="No material was received today.",
                data_type="transactions",
                data=[]
            )
            
        lines = []
        tx_data = []
        for tx in txs:
            lines.append(f"{tx.quantity} {tx.product.unit} of {tx.product.name} from {tx.supplier_name or 'N/A'}")
            tx_data.append({
                "id": tx.id,
                "timestamp": tx.timestamp.isoformat(),
                "sku": tx.product.sku if tx.product else "N/A",
                "product_name": tx.product.name if tx.product else "Unknown",
                "quantity": tx.quantity,
                "unit": tx.product.unit if tx.product else "N/A",
                "user": tx.user.full_name if tx.user else "Unknown",
                "details": f"Received from {tx.supplier_name or 'Supplier'}"
            })
            
        answer = f"Today we received: " + "; ".join(lines) + "."
        return AIQueryResponse(answer=answer, data_type="transactions", data=tx_data)

    # 3.5. What was returned today / returns today
    if any(keyword in q for keyword in ["returned today", "return today", "returns today"]):
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        txs = db.query(Transaction).filter(
            Transaction.type == "return",
            Transaction.timestamp >= today_start,
            Transaction.timestamp <= today_end
        ).all()
        
        if not txs:
            return AIQueryResponse(
                answer="No material was returned today.",
                data_type="transactions",
                data=[]
            )
            
        lines = []
        tx_data = []
        for tx in txs:
            lines.append(f"{tx.quantity} {tx.product.unit} of {tx.product.name} returned by {tx.customer.name if tx.customer else 'N/A'}")
            tx_data.append({
                "id": tx.id,
                "timestamp": tx.timestamp.isoformat(),
                "sku": tx.product.sku if tx.product else "N/A",
                "product_name": tx.product.name if tx.product else "Unknown",
                "quantity": tx.quantity,
                "unit": tx.product.unit if tx.product else "N/A",
                "user": tx.user.full_name if tx.user else "Unknown",
                "details": f"Returned by {tx.customer.name if tx.customer else 'N/A'}"
            })
            
        answer = f"Today we had returned: " + "; ".join(lines) + "."
        return AIQueryResponse(answer=answer, data_type="transactions", data=tx_data)

    # 4. How many [hinges/handles/etc.] are available / count of [item]
    # Check if a category matches
    categories = db.query(Category).all()
    for cat in categories:
        # Check singular/plural of category name
        cat_name_lower = cat.name.lower()
        if cat_name_lower in q or (cat_name_lower.endswith('s') and cat_name_lower[:-1] in q) or q in cat_name_lower:
            products = db.query(Product).filter(Product.category_id == cat.id).all()
            total_stock = 0.0
            prod_data = []
            for p in products:
                stock = get_product_stock(db, p.id)
                total_stock += stock
                prod_data.append({
                    "sku": p.sku,
                    "name": p.name,
                    "brand": p.brand,
                    "current_stock": stock,
                    "unit": p.unit
                })
            
            unit = products[0].unit if products else "units"
            answer = f"There is a total of {total_stock} {unit} of '{cat.name}' available in stock."
            return AIQueryResponse(answer=answer, data_type="products", data=prod_data)
            
    # Check if a specific product matches by name, brand, or SKU
    products = db.query(Product).all()
    matched_products = []
    for p in products:
        if p.name.lower() in q or p.sku.lower() in q or p.brand.lower() in q:
            matched_products.append(p)
            
    if matched_products:
        prod_data = []
        lines = []
        for p in matched_products:
            stock = get_product_stock(db, p.id)
            prod_data.append({
                "sku": p.sku,
                "name": p.name,
                "brand": p.brand,
                "current_stock": stock,
                "unit": p.unit
            })
            lines.append(f"'{p.name}' ({p.brand}) has {stock} {p.unit} in stock")
            
        answer = "I found matching products: " + "; ".join(lines) + "."
        return AIQueryResponse(answer=answer, data_type="products", data=prod_data)

    # Fallback response
    answer = (
        "I couldn't find an answer to that. Try asking:\n"
        "• 'Show low stock items'\n"
        "• 'How many hinges are available?' (or handles, drawer channels, plywood, adhesives, etc.)\n"
        "• 'What was consumed today?' (to see issues for manufacturing)\n"
        "• 'What was received today?' (to see inward shipments)"
    )
    return AIQueryResponse(answer=answer, data_type="text", data=None)
