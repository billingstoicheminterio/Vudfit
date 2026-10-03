import os
import sys

# Ensure backend root is in the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.inspection import inspect
from app.database import Base, STORAGE_DIR
from app.models import User, Category, Brand, Product, Supplier, Customer, Transaction, AuditLog

def main():
    print("=== VUDFIT SQLite to PostgreSQL Data Migration ===")
    
    # Resolve SQLite Database path
    sqlite_db_path = os.path.join(STORAGE_DIR, 'inventory.db')
    if not os.path.exists(sqlite_db_path):
        print(f"Error: SQLite database not found at {sqlite_db_path}")
        sys.exit(1)
    
    # Resolve PostgreSQL Connection URL
    pg_db_url = os.getenv("DATABASE_URL")
    if not pg_db_url:
        print("Error: DATABASE_URL environment variable is not set.")
        sys.exit(1)
        
    print(f"Connecting to SQLite: {sqlite_db_path}")
    sqlite_engine = create_engine(f"sqlite:///{sqlite_db_path}")
    sqlite_Session = sessionmaker(bind=sqlite_engine)
    sqlite_db = sqlite_Session()
    
    print(f"Connecting to PostgreSQL: {pg_db_url.split('@')[-1]}") # Print host/DB only for safety
    pg_engine = create_engine(pg_db_url)
    pg_Session = sessionmaker(bind=pg_engine)
    pg_db = pg_Session()
    
    # 1. Clean PostgreSQL and recreate table structures
    print("Recreating database tables in PostgreSQL...")
    Base.metadata.drop_all(pg_engine)
    Base.metadata.create_all(pg_engine)
    
    # List of models in order of dependency constraints
    models = [
        User,
        Category,
        Brand,
        Product,
        Supplier,
        Customer,
        Transaction,
        AuditLog
    ]
    
    try:
        # 2. Iterate and copy data for each table
        for model_class in models:
            sqlite_rows = sqlite_db.query(model_class).all()
            print(f"-> Migrating {len(sqlite_rows)} rows for table '{model_class.__tablename__}'...")
            
            mapper = inspect(model_class)
            for row in sqlite_rows:
                # Copy only actual database columns and ignore relationship fields
                attrs = {col.key: getattr(row, col.key) for col in mapper.columns}
                new_row = model_class(**attrs)
                pg_db.add(new_row)
            pg_db.commit()
            
        # 3. Synchronize auto-increment sequences in PostgreSQL
        print("Synchronizing PostgreSQL serial sequences...")
        for model_class in models:
            table_name = model_class.__tablename__
            # SQL to reset sequence to max value
            sync_seq_query = text(f"""
                SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), COALESCE(max(id), 1)) FROM {table_name};
            """)
            pg_db.execute(sync_seq_query)
        pg_db.commit()
        
        print("\n=== Database migration completed successfully! ===")
        
    except Exception as e:
        pg_db.rollback()
        print(f"\nMigration failed with error: {e}")
        sys.exit(1)
    finally:
        sqlite_db.close()
        pg_db.close()

if __name__ == "__main__":
    main()
