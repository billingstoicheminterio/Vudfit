# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Supplier, User, AuditLog
from ..schemas import SupplierResponse, SupplierCreate
from ..auth import get_current_user, get_admin_user

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Supplier).all()

@router.post("", response_model=SupplierResponse)
def create_supplier(
    supplier_in: SupplierCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Supplier).filter(Supplier.name.ilike(supplier_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier name already exists")
        
    supp = Supplier(
        name=supplier_in.name,
        contact_person=supplier_in.contact_person,
        email=supplier_in.email,
        phone=supplier_in.phone,
        address=supplier_in.address
    )
    db.add(supp)
    db.commit()
    db.refresh(supp)
    
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="CREATE_SUPPLIER",
        details=f"Created supplier {supp.name}."
    )
    db.add(audit_entry)
    db.commit()
    
    return supp

@router.post("/bulk", response_model=List[SupplierResponse])
def bulk_create_suppliers(
    suppliers_in: List[SupplierCreate],
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    created_suppliers = []
    # Extract lowercased existing names to avoid adding database duplicates
    existing_names = {s[0].lower() for s in db.query(Supplier.name).all()}
    
    for s_in in suppliers_in:
        name_clean = s_in.name.strip()
        if not name_clean:
            continue
        if name_clean.lower() in existing_names:
            continue
            
        supp = Supplier(
            name=name_clean,
            contact_person=s_in.contact_person,
            email=s_in.email,
            phone=s_in.phone,
            address=s_in.address
        )
        db.add(supp)
        existing_names.add(name_clean.lower())
        created_suppliers.append(supp)
        
    if created_suppliers:
        db.commit()
        for supp in created_suppliers:
            db.refresh(supp)
            
        audit_entry = AuditLog(
            user_id=current_user.id,
            action="BULK_CREATE_SUPPLIERS",
            details=f"Bulk imported {len(created_suppliers)} suppliers."
        )
        db.add(audit_entry)
        db.commit()
        
    return created_suppliers

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_in: SupplierCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    supp = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supp:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    if supplier_in.name.lower() != supp.name.lower():
        existing = db.query(Supplier).filter(Supplier.name.ilike(supplier_in.name)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Supplier name already exists")
            
    supp.name = supplier_in.name.strip()
    supp.contact_person = supplier_in.contact_person.strip() if supplier_in.contact_person else None
    supp.email = supplier_in.email.strip() if supplier_in.email else None
    supp.phone = supplier_in.phone.strip() if supplier_in.phone else None
    supp.address = supplier_in.address.strip() if supplier_in.address else None
    
    db.commit()
    db.refresh(supp)
    
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="UPDATE_SUPPLIER",
        details=f"Updated supplier {supp.name}."
    )
    db.add(audit_entry)
    db.commit()
    
    return supp

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    supp = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supp:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    name = supp.name
    db.delete(supp)
    db.commit()
    
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="DELETE_SUPPLIER",
        details=f"Deleted supplier {name}."
    )
    db.add(audit_entry)
    db.commit()
    
    return {"message": f"Supplier {name} deleted successfully"}
