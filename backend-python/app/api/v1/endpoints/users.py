"""
Routes des utilisateurs
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.models.user import User
from app.core.auth import hash_password, verify_password
from app.core.deps import get_current_user

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Récupère le profil de l'utilisateur actuel"""
    return UserResponse.from_orm(current_user)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour le profil de l'utilisateur actuel"""
    
    # Mettre à jour le nom si fourni
    if user_data.name is not None:
        current_user.name = user_data.name
    
    # Mettre à jour le mot de passe si fourni
    if user_data.password is not None:
        current_user.password = hash_password(user_data.password)
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)
