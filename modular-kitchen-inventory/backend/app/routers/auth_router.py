from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from ..models import User, AuditLog, Transaction
from ..schemas import Token, UserResponse, UserCreate, UserUpdate
from ..auth import verify_password, create_access_token, get_current_user, get_master_user, get_password_hash

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    input_username = form_data.username.strip().lower() if form_data.username else ""
    user = db.query(User).filter(func.lower(User.username) == input_username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    # Log the action
    audit_entry = AuditLog(user_id=user.id, action="LOGIN", details=f"User {user.username} logged in successfully.")
    db.add(audit_entry)
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/users", response_model=UserResponse)
def create_user(user_in: UserCreate, current_user: User = Depends(get_master_user), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username,
        password_hash=hashed_pwd,
        role=user_in.role,
        full_name=user_in.full_name,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Audit log
    audit_entry = AuditLog(
        user_id=current_user.id, 
        action="CREATE_USER", 
        details=f"Created new user {new_user.username} with role {new_user.role}"
    )
    db.add(audit_entry)
    db.commit()
    
    return new_user

@router.get("/users", response_model=List[UserResponse])
def list_users(current_user: User = Depends(get_master_user), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id).all()

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, current_user: User = Depends(get_master_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.username == "master" and user_update.role and user_update.role != "master":
        raise HTTPException(status_code=400, detail="Cannot change the role of the master account")
        
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        if user.username == "master" and not user_update.is_active:
            raise HTTPException(status_code=400, detail="Cannot deactivate the master account")
        user.is_active = user_update.is_active
    if user_update.password is not None and user_update.password.strip() != "":
        user.password_hash = get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(user)
    
    # Audit log
    audit_entry = AuditLog(
        user_id=current_user.id, 
        action="UPDATE_USER", 
        details=f"Updated user details for {user.username}"
    )
    db.add(audit_entry)
    db.commit()
    
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(get_master_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.username == "master":
        raise HTTPException(status_code=400, detail="Cannot delete the master account")
        
    # Check if they have transactions or audit logs
    has_transactions = db.query(Transaction).filter(Transaction.user_id == user_id).first() is not None
    has_audit_logs = db.query(AuditLog).filter(AuditLog.user_id == user_id).first() is not None
    
    if has_transactions or has_audit_logs:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete user account that has recorded transactions or audit logs. Please toggle their status to 'Suspended' instead to block access."
        )
        
    username = user.username
    db.delete(user)
    db.commit()
    
    # Audit log
    audit_entry = AuditLog(
        user_id=current_user.id, 
        action="DELETE_USER", 
        details=f"Deleted user account {username}"
    )
    db.add(audit_entry)
    db.commit()
    
    return {"detail": f"User {username} deleted successfully"}
