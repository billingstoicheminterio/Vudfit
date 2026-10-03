from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from ..models import Category, User, AuditLog
from ..schemas import CategoryResponse, CategoryCreate
from ..auth import get_current_user, get_admin_user

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Category).all()

@router.post("", response_model=CategoryResponse)
def create_category(
    category_in: CategoryCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    name_clean = category_in.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Category name cannot be empty")
        
    existing = db.query(Category).filter(Category.name.ilike(name_clean)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
        
    code_clean = category_in.code.strip().upper() if category_in.code else ""
    if not code_clean:
        code_clean = "".join([c for c in name_clean if c.isalnum()])[:2].upper()
        if len(code_clean) < 2:
            code_clean = (code_clean + "XX")[:2]
            
    if not (2 <= len(code_clean) <= 3) or not code_clean.isalnum():
        raise HTTPException(status_code=400, detail="Category code must be 2-3 alphanumeric characters")
        
    existing_code = db.query(Category).filter(func.upper(Category.code) == code_clean).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Category code '{code_clean}' is already in use")
        
    cat = Category(name=name_clean, code=code_clean, description=category_in.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="CREATE_CATEGORY",
        details=f"Created category: {cat.name} (Code: {cat.code})."
    )
    db.add(audit_entry)
    db.commit()
    
    return cat

@router.put("/{id}", response_model=CategoryResponse)
def update_category(
    id: int,
    category_in: CategoryCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
        
    name_clean = category_in.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Category name cannot be empty")
        
    existing = db.query(Category).filter(
        Category.name.ilike(name_clean),
        Category.id != id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
        
    code_clean = category_in.code.strip().upper() if category_in.code else ""
    if not code_clean:
        code_clean = "".join([c for c in name_clean if c.isalnum()])[:2].upper()
        if len(code_clean) < 2:
            code_clean = (code_clean + "XX")[:2]
            
    if not (2 <= len(code_clean) <= 3) or not code_clean.isalnum():
        raise HTTPException(status_code=400, detail="Category code must be 2-3 alphanumeric characters")
        
    existing_code = db.query(Category).filter(
        func.upper(Category.code) == code_clean,
        Category.id != id
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Category code '{code_clean}' is already in use")
        
    old_name = cat.name
    old_code = cat.code
    cat.name = name_clean
    cat.code = code_clean
    cat.description = category_in.description
    db.commit()
    db.refresh(cat)
    
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="UPDATE_CATEGORY",
        details=f"Updated category: {old_name} (Code: {old_code}) to {cat.name} (Code: {cat.code})."
    )
    db.add(audit_entry)
    db.commit()
    
    return cat

@router.delete("/{id}")
def delete_category(
    id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
        
    cat_name = cat.name
    db.delete(cat)
    
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="DELETE_CATEGORY",
        details=f"Deleted category: {cat_name}."
    )
    db.add(audit_entry)
    db.commit()
    
    return {"message": f"Category '{cat_name}' deleted successfully"}
