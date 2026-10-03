from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, func, Index
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "admin" or "staff"
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    transactions = relationship("Transaction", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=True)
    description = Column(String, nullable=True)
    
    products = relationship("Product", back_populates="category")


class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)


class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    transactions = relationship("Transaction", back_populates="customer")


class Brand(Base):
    __tablename__ = "brands"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=True)


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    brand = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    unit = Column(String, nullable=False)  # e.g., "pcs", "boxes", "kg", "mtrs"
    barcode = Column(String, unique=True, index=True, nullable=False)
    min_stock = Column(Float, default=0.0)
    unit_cost = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    colour = Column(String, nullable=False, default="no")
    created_at = Column(DateTime, server_default=func.now())
    
    # SKU Redesign components stored independently
    brand_code = Column(String, nullable=True)
    brand_name = Column(String, nullable=True)
    category_code = Column(String, nullable=True)
    category_name = Column(String, nullable=True)
    color_code = Column(String, nullable=True)
    color_name = Column(String, nullable=True)
    global_serial = Column(Integer, unique=True, index=True, nullable=True)
    
    category = relationship("Category", back_populates="products")
    transactions = relationship("Transaction", back_populates="product", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index('idx_tx_product_type', 'product_id', 'type'),
        Index('idx_tx_timestamp', 'timestamp'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    type = Column(String, nullable=False)  # "inward" or "outward"
    quantity = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, server_default=func.now())
    
    # Optional fields based on transaction type
    supplier_name = Column(String, nullable=True)  # Inward
    invoice_number = Column(String, nullable=True)  # Inward
    department = Column(String, nullable=True)      # Outward
    remarks = Column(String, nullable=True)
    image_url = Column(String, nullable=True)       # Captured photo URL (Outward condition / audit reference)
    
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    
    product = relationship("Product", back_populates="transactions")
    user = relationship("User", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())
    details = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="audit_logs")
