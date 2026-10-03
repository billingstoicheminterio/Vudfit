from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from ..models import Brand, User, AuditLog
from ..schemas import BrandResponse, BrandCreate
from ..auth import get_current_user, get_admin_user

router = APIRouter(prefix="/brands", tags=["Brands"])

@router.get("", response_model=List[BrandResponse])
def list_brands(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Brand).all()

@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
def create_brand(
    brand_in: BrandCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    name_clean = brand_in.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Brand name cannot be empty")
        
    existing = db.query(Brand).filter(func.lower(Brand.name) == name_clean.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Brand '{name_clean}' already exists")
        
    code_clean = brand_in.code.strip().upper() if brand_in.code else ""
    if not code_clean:
        code_clean = "".join([c for c in name_clean if c.isalnum()])[:2].upper()
        if len(code_clean) < 2:
            code_clean = (code_clean + "XX")[:2]
            
    if not (2 <= len(code_clean) <= 3) or not code_clean.isalnum():
        raise HTTPException(status_code=400, detail="Brand code must be 2-3 alphanumeric characters")
        
    existing_code = db.query(Brand).filter(func.upper(Brand.code) == code_clean).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Brand code '{code_clean}' is already in use")
        
    brand = Brand(name=name_clean, code=code_clean)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE_BRAND",
        details=f"Created brand: {brand.name} (Code: {brand.code})"
    )
    db.add(audit)
    db.commit()
    
    return brand

@router.put("/{id}", response_model=BrandResponse)
def update_brand(
    id: int,
    brand_in: BrandCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    brand = db.query(Brand).filter(Brand.id == id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    name_clean = brand_in.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Brand name cannot be empty")
        
    existing = db.query(Brand).filter(
        func.lower(Brand.name) == name_clean.lower(),
        Brand.id != id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Brand '{name_clean}' already exists")
        
    code_clean = brand_in.code.strip().upper() if brand_in.code else ""
    if not code_clean:
        code_clean = "".join([c for c in name_clean if c.isalnum()])[:2].upper()
        if len(code_clean) < 2:
            code_clean = (code_clean + "XX")[:2]
            
    if not (2 <= len(code_clean) <= 3) or not code_clean.isalnum():
        raise HTTPException(status_code=400, detail="Brand code must be 2-3 alphanumeric characters")
        
    existing_code = db.query(Brand).filter(
        func.upper(Brand.code) == code_clean,
        Brand.id != id
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Brand code '{code_clean}' is already in use")
        
    old_name = brand.name
    old_code = brand.code
    brand.name = name_clean
    brand.code = code_clean
    db.commit()
    db.refresh(brand)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_BRAND",
        details=f"Updated brand: {old_name} (Code: {old_code}) to {brand.name} (Code: {brand.code})"
    )
    db.add(audit)
    db.commit()
    
    return brand

@router.delete("/{id}")
def delete_brand(
    id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    brand = db.query(Brand).filter(Brand.id == id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    brand_name = brand.name
    db.delete(brand)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE_BRAND",
        details=f"Deleted brand: {brand_name}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": f"Brand '{brand_name}' deleted successfully"}
