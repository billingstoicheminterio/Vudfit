from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# User schemas
class UserBase(BaseModel):
    username: str
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

# Category schemas
class CategoryBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Supplier schemas
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Customer schemas
class CustomerBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Product schemas
class ProductBase(BaseModel):
    sku: str
    name: str
    brand: str
    category_id: int
    unit: str
    barcode: str
    min_stock: float = 0.0
    unit_cost: float = 0.0
    description: Optional[str] = None
    image_url: Optional[str] = None
    colour: str = "no"
    brand_code: Optional[str] = None
    brand_name: Optional[str] = None
    category_code: Optional[str] = None
    category_name: Optional[str] = None
    color_code: Optional[str] = None
    color_name: Optional[str] = None
    global_serial: Optional[int] = None

class ProductCreate(BaseModel):
    name: str
    brand: str
    category_id: int
    unit: str
    min_stock: float = 0.0
    unit_cost: float = 0.0
    description: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    colour: Optional[str] = "no"
    color_code: Optional[str] = None
    color_name: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category_id: Optional[int] = None
    unit: Optional[str] = None
    min_stock: Optional[float] = None
    unit_cost: Optional[float] = None
    description: Optional[str] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    colour: Optional[str] = None
    color_code: Optional[str] = None
    color_name: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    current_stock: float = 0.0
    category_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Transaction schemas
class TransactionCreateInward(BaseModel):
    product_barcode_or_sku: str
    quantity: float
    supplier_name: Optional[str] = None
    invoice_number: Optional[str] = None
    remarks: Optional[str] = None

class TransactionCreateOutward(BaseModel):
    product_barcode_or_sku: str
    quantity: float
    customer_id: int
    remarks: Optional[str] = None
    image_url: Optional[str] = None

class StockAdjustmentRequest(BaseModel):
    product_id: int
    quantity: float
    type: str  # "inward" (add) or "outward" (deduct)
    remarks: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    type: str
    quantity: float
    user_id: int
    user_fullname: str
    timestamp: datetime
    supplier_name: Optional[str] = None
    invoice_number: Optional[str] = None
    department: Optional[str] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    remarks: Optional[str] = None
    image_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# AuditLog schemas
class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    user_fullname: str
    action: str
    timestamp: datetime
    details: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Inventory status aggregation
class InventoryStatus(BaseModel):
    product_id: int
    sku: str
    name: str
    brand: str
    category_name: str
    unit: str
    barcode: str
    min_stock: float
    unit_cost: float
    total_inward: float
    total_outward: float
    total_returned: float = 0.0
    current_stock: float
    status: str  # "healthy", "low", "critical"
    image_url: Optional[str] = None

# Dashboard Metrics
class DashboardMetrics(BaseModel):
    total_products: int
    total_inventory: float
    low_stock_count: int
    today_inward: int
    today_outward: int
    inventory_value: float
    recent_activities: List[Any] = []
    reorder_recommendations: List[Any] = []
    category_distribution: List[Any] = []
    weekly_movement: List[Any] = []

# AI query schemas
class AIQueryRequest(BaseModel):
    query: str

class AIQueryResponse(BaseModel):
    answer: str
    data_type: str  # "text", "products", "transactions"
    data: Optional[List[Any]] = None

# Bulk Inward schemas
class BulkInwardItem(BaseModel):
    product_barcode_or_sku: str
    quantity: float
    remarks: Optional[str] = None

class BulkTransactionCreateInward(BaseModel):
    supplier_name: Optional[str] = None
    invoice_number: Optional[str] = None
    remarks: Optional[str] = None
    image_url: Optional[str] = None
    items: List[BulkInwardItem]

# Bulk Outward schemas
class BulkOutwardItem(BaseModel):
    product_barcode_or_sku: str
    quantity: float
    remarks: Optional[str] = None
    image_url: Optional[str] = None

class BulkTransactionCreateOutward(BaseModel):
    customer_id: int
    remarks: Optional[str] = None
    image_url: Optional[str] = None
    items: List[BulkOutwardItem]

# Bulk Return schemas
class BulkReturnItem(BaseModel):
    product_barcode_or_sku: str
    quantity: float
    remarks: Optional[str] = None
    image_url: Optional[str] = None

class BulkTransactionCreateReturn(BaseModel):
    customer_id: int
    remarks: Optional[str] = None
    image_url: Optional[str] = None
    items: List[BulkReturnItem]

# Brand schemas
class BrandBase(BaseModel):
    name: str
    code: Optional[str] = None

class BrandCreate(BrandBase):
    pass

class BrandResponse(BrandBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


