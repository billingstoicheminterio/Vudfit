import os
import sys
import csv
from sqlalchemy import or_, func

# Add backend directory to path so we can import from app
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

try:
    from app.database import SessionLocal
    from app.models import Product, Category, Brand, User, AuditLog
except ImportError as e:
    print("Error: Could not import app modules. Please make sure you run this script from the project root directory.")
    print("Detail:", e)
    sys.exit(1)

def clean_header(h):
    return h.strip().lower().replace(" ", "_").replace("/", "_").replace("\\", "_")

def import_csv(csv_path):
    if not os.path.exists(csv_path):
        print(f"Error: File '{csv_path}' does not exist.")
        return

    print(f"Reading CSV file: {csv_path}...")
    
    # Read CSV file and handle BOM automatically
    try:
        with open(csv_path, mode='r', encoding='utf-8-sig') as f:
            # Auto-detect delimiter
            sample = f.read(2048)
            f.seek(0)
            sniffer = csv.Sniffer()
            if sample:
                try:
                    dialect = sniffer.sniff(sample, delimiters=',;\t')
                    delimiter = dialect.delimiter
                except Exception:
                    delimiter = ','
            else:
                delimiter = ','

            print(f"Detected separator: '{repr(delimiter)}'")
            reader = csv.reader(f, delimiter=delimiter)
            
            headers = next(reader)
            cleaned_headers = [clean_header(h) for h in headers]
            
            rows = []
            for row_num, row_data in enumerate(reader, start=2):
                if not row_data or all(not val.strip() for val in row_data):
                    continue
                # Map headers to values
                row_dict = {}
                for idx, h in enumerate(cleaned_headers):
                    if idx < len(row_data):
                        row_dict[h] = row_data[idx].strip()
                    else:
                        row_dict[h] = ""
                rows.append((row_num, row_dict))
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return

    print(f"Found {len(rows)} data rows to process.")
    
    db = SessionLocal()
    try:
        # Prerequisites: Find or seed Category
        categories = db.query(Category).all()
        if not categories:
            print("No categories found in database. Seeding default categories first...")
            from app.seed import seed_db
            seed_db()
            categories = db.query(Category).all()
        
        cats_by_name = {c.name.lower().strip(): c for c in categories}
        cats_by_code = {c.code.lower().strip(): c for c in categories if c.code}
        
        # Resolve a master user for audit log
        master_user = db.query(User).filter(User.role == "master").first()
        if not master_user:
            master_user = db.query(User).filter(User.role == "admin").first()
        if not master_user:
            print("Error: No administrative user found in database to log the import.")
            return

        max_serial = db.query(func.max(Product.global_serial)).scalar() or 0
        current_serial = max_serial
        
        COLOR_CODES = {
            "black": "BK", "white": "WH", "silver": "SV", "grey": "GY", "gray": "GY",
            "gold": "GD", "brown": "BR", "natural": "NT", "not applicable": "NA", "na": "NA", "none": "NA"
        }
        
        imported_count = 0
        batch_skus = set()
        
        print("\nProcessing products...")
        for row_num, row in rows:
            # Helper to find values across possible header spellings
            def find_val(keys):
                for k in keys:
                    cleaned_k = clean_header(k)
                    if cleaned_k in row:
                        return row[cleaned_k]
                return None

            name = find_val(["product name", "name", "item name", "product"]) or "Unnamed Material"
            brand_name_str = find_val(["brand", "company", "make"]) or "Generic"
            cat_name_str = find_val(["category", "category name", "cat", "category id"]) or "Others"
            unit = find_val(["unit", "unit of measure", "uom"]) or "pcs"
            colour_val = find_val(["colour", "color"]) or "Not Applicable"
            description = find_val(["description", "desc", "remarks"]) or ""
            
            custom_sku = find_val(["sku", "our code", "code"])
            
            try:
                min_stock = float(find_val(["min stock", "minimum stock", "min_stock"]) or 0)
            except ValueError:
                min_stock = 0.0
                
            try:
                unit_cost = float(find_val(["unit cost", "cost", "price", "unit_cost"]) or 0)
            except ValueError:
                unit_cost = 0.0

            # 1. Resolve Category
            category = None
            if cat_name_str:
                cat_clean = cat_name_str.lower().strip()
                if cat_clean in cats_by_name:
                    category = cats_by_name[cat_clean]
                elif cat_clean in cats_by_code:
                    category = cats_by_code[cat_clean]
            
            if not category:
                # Default to first Category named 'others', 'general', or 'consumables'
                for fallback in ["others", "general", "consumables"]:
                    if fallback in cats_by_name:
                        category = cats_by_name[fallback]
                        break
                if not category:
                    category = categories[0]

            category_code = category.code or "GEN"
            category_name = category.name

            # 2. Resolve Brand
            brand_name_str = brand_name_str.strip()
            brand_rec = db.query(Brand).filter(
                or_(
                    func.lower(Brand.name) == brand_name_str.lower(),
                    func.upper(Brand.code) == brand_name_str.upper()
                )
            ).first()
            if not brand_rec:
                b_code = "".join([c for c in brand_name_str.lower() if c.isalnum()])[:2].upper()
                if len(b_code) < 2:
                    b_code = (b_code + "XX")[:2]
                
                # Ensure code is unique in brand table
                dup_brand_code = db.query(Brand).filter(func.upper(Brand.code) == b_code).first()
                counter = 0
                while dup_brand_code:
                    b_code = (b_code[:1] + str(counter))[:2]
                    counter += 1
                    dup_brand_code = db.query(Brand).filter(func.upper(Brand.code) == b_code).first()
                    
                brand_rec = Brand(name=brand_name_str, code=b_code)
                db.add(brand_rec)
                db.commit()
                db.refresh(brand_rec)

            brand_code = brand_rec.code
            brand_name = brand_rec.name

            # 3. Color resolution
            colour_val = colour_val.strip()
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

            # 4. Generate unique serial and barcode
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

            # 5. Resolve SKU & Unique validation
            if custom_sku and custom_sku.strip() != "":
                sku = custom_sku.strip()
                if sku in batch_skus:
                    print(f"Skipping row {row_num}: Duplicate SKU '{sku}' inside the CSV file.")
                    continue
                exists_sku = db.query(Product).filter(Product.sku == sku).first()
                if exists_sku:
                    print(f"Skipping row {row_num}: SKU '{sku}' is already in use in the database catalog.")
                    continue
                batch_skus.add(sku)
                barcode = generated_code
            else:
                sku = generated_code
                barcode = generated_code
                batch_skus.add(sku)

            # 6. Create product object
            product = Product(
                sku=sku,
                name=name,
                brand=brand_name,
                category_id=category.id,
                unit=unit,
                barcode=barcode,
                min_stock=min_stock,
                unit_cost=unit_cost,
                description=description,
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
            imported_count += 1

        db.commit()
        
        # Log the action in AuditLog
        audit_entry = AuditLog(
            user_id=master_user.id,
            action="BULK_IMPORT_CLI",
            details=f"CLI bulk imported {imported_count} products via CSV utility."
        )
        db.add(audit_entry)
        db.commit()
        
        print(f"\nSuccess! Successfully imported {imported_count} products into the database catalog.")
    except Exception as e:
        db.rollback()
        print(f"\nDatabase transaction failed. All modifications rolled back. Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: .venv\\Scripts\\python.exe import_catalog.py <path_to_csv_file>")
        print("\nOr just enter the path to the CSV file here:")
        csv_file = input("CSV File Path: ").strip()
        if csv_file.startswith('"') and csv_file.endswith('"'):
            csv_file = csv_file[1:-1]
        import_csv(csv_file)
    else:
        import_csv(sys.argv[1])
