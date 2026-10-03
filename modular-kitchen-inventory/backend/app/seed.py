import sys
import os

# Add parent directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal, Base
from app.models import User, Category, Supplier, Product, Transaction, Customer
import bcrypt

def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed Categories
        categories_to_seed = [
            {"name": "Hinges", "description": "Soft close hinges, cabinet hinges, glass door hinges"},
            {"name": "Handles", "description": "G-profile handles, profile handles, T-bar handles, knobs"},
            {"name": "Drawer Channels", "description": "Tandem boxes, telescopic slides, soft-close channels"},
            {"name": "Plywood", "description": "BWP Marine plywood, MR grade plywood, commercial plywood"},
            {"name": "MDF", "description": "Medium-density fiberboards, exterior grade MDF"},
            {"name": "Laminates", "description": "High-pressure laminates, acrylic sheets, PVC laminates"},
            {"name": "Adhesives", "description": "Synthetic wood adhesives (Fevicol), contact adhesives, masking tapes"},
            {"name": "Screws", "description": "Gypsum screws, wood screws, self-tapping screws of various sizes"},
            {"name": "Accessories", "description": "Corner carousel, pull-outs, cutlery trays, tall units"},
            {"name": "Consumables", "description": "Sandpaper, gloves, cleaning solvent, edge banding tapes"}
        ]
        
        print("Seeding Categories...")
        category_objects = []
        for cat in categories_to_seed:
            existing = db.query(Category).filter(Category.name == cat["name"]).first()
            if not existing:
                c = Category(name=cat["name"], description=cat["description"])
                db.add(c)
                category_objects.append(c)
                print(f"Added category: {cat['name']}")
        
        # 2. Seed Suppliers
        suppliers_to_seed = [
            {"name": "Hafele India Pvt Ltd", "contact_person": "Amit Sharma", "email": "amit.sharma@hafele.in", "phone": "+919876543210", "address": "Mumbai HQ, India"},
            {"name": "Greenply Industries Ltd", "contact_person": "R. K. Gupta", "email": "rk.gupta@greenply.com", "phone": "+919876543211", "address": "Kolkata, India"},
            {"name": "Pidilite Industries Ltd", "contact_person": "Sanjay Patel", "email": "sanjay.patel@pidilite.com", "phone": "+919876543212", "address": "Andheri East, Mumbai, India"},
            {"name": "Hettich India Pvt Ltd", "contact_person": "Vikram Rathore", "email": "vikram.rathore@hettich.in", "phone": "+919876543213", "address": "New Delhi, India"}
        ]
        
        print("Seeding Suppliers...")
        for supp in suppliers_to_seed:
            existing = db.query(Supplier).filter(Supplier.name == supp["name"]).first()
            if not existing:
                s = Supplier(
                    name=supp["name"],
                    contact_person=supp["contact_person"],
                    email=supp["email"],
                    phone=supp["phone"],
                    address=supp["address"]
                )
                db.add(s)
                print(f"Added supplier: {supp['name']}")

        # 2.5 Seed Customers
        customers_to_seed = [
            {"name": "Vudfit Delhi Showroom", "contact_person": "Vikram Malhotra", "email": "delhi.showroom@vudfit.com", "phone": "+919999111100", "address": "Kirti Nagar, New Delhi"},
            {"name": "Luxury Spaces Ltd", "contact_person": "Neha Kapoor", "email": "info@luxuryspaces.in", "phone": "+919811223344", "address": "Gurugram, Haryana"},
            {"name": "Rohan Mehta (Homeowner)", "contact_person": "Rohan Mehta", "email": "rohan@gmail.com", "phone": "+919560012345", "address": "South Extension, New Delhi"}
        ]
        
        print("Seeding Customers...")
        for cust in customers_to_seed:
            existing = db.query(Customer).filter(Customer.name == cust["name"]).first()
            if not existing:
                c = Customer(
                    name=cust["name"],
                    contact_person=cust["contact_person"],
                    email=cust["email"],
                    phone=cust["phone"],
                    address=cust["address"]
                )
                db.add(c)
                print(f"Added customer: {cust['name']}")

        # 3. Seed Users
        users_to_seed = [
            {
                "username": "master",
                "password_hash": get_password_hash("master123"),
                "role": "master",
                "full_name": "Master Administrator"
            },
            {
                "username": "admin",
                "password_hash": get_password_hash("admin123"),
                "role": "admin",
                "full_name": "System Administrator"
            },
            {
                "username": "staff",
                "password_hash": get_password_hash("staff123"),
                "role": "staff",
                "full_name": "Warehouse Operator"
            }
        ]
        
        print("Seeding Users...")
        for user_data in users_to_seed:
            existing = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing:
                u = User(
                    username=user_data["username"],
                    password_hash=user_data["password_hash"],
                    role=user_data["role"],
                    full_name=user_data["full_name"],
                    is_active=True
                )
                db.add(u)
                print(f"Added user: {user_data['username']} ({user_data['role']})")
                
        db.commit()
        
        # 4. Seed Products
        print("Seeding Products...")
        cats = {c.name: c.id for c in db.query(Category).all()}
        products_to_seed = [
            {"sku": "MK-HIN-001", "name": "3D Auto Soft Close Hinge", "brand": "Hafele", "category_name": "Hinges", "unit": "pcs", "barcode": "MK-HIN-001", "min_stock": 200, "unit_cost": 75.0, "description": "110 degree soft close slide-on hinge for kitchen cabinets"},
            {"sku": "MK-HIN-002", "name": "Glass Door Hinge Chrome", "brand": "Hafele", "category_name": "Hinges", "unit": "pcs", "barcode": "MK-HIN-002", "min_stock": 50, "unit_cost": 120.0, "description": "Chrome finish hinge for glass panel kitchen doors"},
            {"sku": "MK-HAN-001", "name": "G-Profile Handle Silver 3m", "brand": "Hettich", "category_name": "Handles", "unit": "mtrs", "barcode": "MK-HAN-001", "min_stock": 30, "unit_cost": 450.0, "description": "Aluminum G-profile handle, silver anodized finish"},
            {"sku": "MK-HAN-002", "name": "T-Bar Handle Matte Black", "brand": "Generic", "category_name": "Handles", "unit": "pcs", "barcode": "MK-HAN-002", "min_stock": 100, "unit_cost": 85.0, "description": "160mm Matte black modern T-bar handle"},
            {"sku": "MK-CHA-001", "name": "Tandem Box Drawer System 500mm", "brand": "Hettich", "category_name": "Drawer Channels", "unit": "sets", "barcode": "MK-CHA-001", "min_stock": 40, "unit_cost": 1850.0, "description": "Soft close double-wall drawer system, load capacity 35kg"},
            {"sku": "MK-CHA-002", "name": "Telescopic Slide 18 inch", "brand": "Generic", "category_name": "Drawer Channels", "unit": "sets", "barcode": "MK-CHA-002", "min_stock": 80, "unit_cost": 320.0, "description": "Heavy duty ball bearing telescopic drawer slides"},
            {"sku": "MK-PLY-001", "name": "BWP Marine Plywood 18mm", "brand": "Greenply", "category_name": "Plywood", "unit": "sheets", "barcode": "MK-PLY-001", "min_stock": 50, "unit_cost": 2200.0, "description": "Boiling Water Proof marine grade plywood, 8x4 feet"},
            {"sku": "MK-MDF-001", "name": "Exterior Grade MDF 12mm", "brand": "Greenply", "category_name": "MDF", "unit": "sheets", "barcode": "MK-MDF-001", "min_stock": 40, "unit_cost": 1100.0, "description": "High density exterior grade MDF sheet, moisture resistant"},
            {"sku": "MK-LAM-001", "name": "High Gloss White Acrylic Sheet", "brand": "Greenply", "category_name": "Laminates", "unit": "sheets", "barcode": "MK-LAM-001", "min_stock": 25, "unit_cost": 2800.0, "description": "1mm thickness high gloss white acrylic laminate"},
            {"sku": "MK-ADH-001", "name": "Fevicol SH Adhesive 50kg", "brand": "Pidilite", "category_name": "Adhesives", "unit": "tubs", "barcode": "MK-ADH-001", "min_stock": 10, "unit_cost": 6500.0, "description": "Synthetic wood adhesive for laminating plywood and MDF"},
            {"sku": "MK-SCR-001", "name": "Gypsum Screw 1.25 inch", "brand": "Generic", "category_name": "Screws", "unit": "boxes", "barcode": "MK-SCR-001", "min_stock": 20, "unit_cost": 180.0, "description": "Black phosphate drywall screws, 1000 pcs per box"}
        ]
        
        for p_data in products_to_seed:
            existing = db.query(Product).filter(Product.sku == p_data["sku"]).first()
            if not existing:
                p = Product(
                    sku=p_data["sku"],
                    name=p_data["name"],
                    brand=p_data["brand"],
                    category_id=cats[p_data["category_name"]],
                    unit=p_data["unit"],
                    barcode=p_data["barcode"],
                    min_stock=p_data["min_stock"],
                    unit_cost=p_data["unit_cost"],
                    description=p_data["description"]
                )
                db.add(p)
                print(f"Added product: {p.name} (SKU: {p.sku})")
                
        db.commit()
        
        # 5. Seed Transactions (to build initial stock levels)
        print("Seeding Transactions...")
        admin_user = db.query(User).filter(User.username == "admin").first()
        staff_user = db.query(User).filter(User.username == "staff").first()
        customers = db.query(Customer).all()
        
        db_products = db.query(Product).all()
        for p in db_products:
            # Check if transactions already exist
            tx_exists = db.query(Transaction).filter(Transaction.product_id == p.id).first()
            if tx_exists:
                continue
                
            if p.sku == "MK-HIN-001":
                inward_qty = 500.0
                outward_qty = 150.0
            elif p.sku == "MK-HIN-002":
                inward_qty = 40.0
                outward_qty = 5.0
            elif p.sku == "MK-HAN-001":
                inward_qty = 10.0
                outward_qty = 5.0
            elif p.sku == "MK-HAN-002":
                inward_qty = 200.0
                outward_qty = 50.0
            elif p.sku == "MK-CHA-001":
                inward_qty = 100.0
                outward_qty = 30.0
            elif p.sku == "MK-CHA-002":
                inward_qty = 150.0
                outward_qty = 60.0
            elif p.sku == "MK-PLY-001":
                inward_qty = 120.0
                outward_qty = 40.0
            elif p.sku == "MK-MDF-001":
                inward_qty = 30.0
                outward_qty = 5.0
            elif p.sku == "MK-LAM-001":
                inward_qty = 50.0
                outward_qty = 10.0
            elif p.sku == "MK-ADH-001":
                inward_qty = 15.0
                outward_qty = 12.0
            else:
                inward_qty = 50.0
                outward_qty = 10.0
                
            tx_in = Transaction(
                product_id=p.id,
                type="inward",
                quantity=inward_qty,
                user_id=admin_user.id,
                supplier_name="Hafele India Pvt Ltd" if p.category_id == cats["Hinges"] else "Greenply Industries Ltd",
                invoice_number="INV-2026-001",
                remarks="Initial warehouse opening stock load"
            )
            db.add(tx_in)
            
            if outward_qty > 0:
                customer_id = None
                if customers:
                    customer_id = customers[p.id % len(customers)].id
                
                tx_out = Transaction(
                    product_id=p.id,
                    type="outward",
                    quantity=outward_qty,
                    user_id=staff_user.id,
                    remarks="Initial stock issue for project requirements",
                    customer_id=customer_id
                )
                db.add(tx_out)
                
        db.commit()
        print("Transactions seeded successfully!")
        print("Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
