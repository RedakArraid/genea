"""
Routes des arbres généalogiques
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.family_tree import FamilyTreeCreate, FamilyTreeUpdate, FamilyTreeResponse, FamilyTreeDetailResponse
from app.schemas.person import PersonCreate
from app.models.family_tree import FamilyTree
from app.models.person import Person
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter()


def check_tree_ownership(tree_id: str, user: User, db: Session) -> FamilyTree:
    """Vérifie que l'utilisateur est propriétaire de l'arbre"""
    tree = db.query(FamilyTree).filter(FamilyTree.id == tree_id).first()
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arbre généalogique non trouvé"
        )
    
    if tree.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit à cet arbre généalogique"
        )
    
    return tree


@router.get("/", response_model=List[FamilyTreeResponse])
def get_user_trees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les arbres de l'utilisateur"""
    trees = db.query(FamilyTree).filter(FamilyTree.owner_id == current_user.id).all()
    return [FamilyTreeResponse.from_orm(tree) for tree in trees]


@router.get("/{tree_id}", response_model=FamilyTreeDetailResponse)
def get_tree_detail(
    tree_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère un arbre avec tous ses éléments"""
    tree = check_tree_ownership(tree_id, current_user, db)
    
    # Charger tous les éléments liés
    tree_with_data = db.query(FamilyTree).filter(FamilyTree.id == tree_id).first()
    
    return FamilyTreeDetailResponse.from_orm(tree_with_data)


@router.post("/", response_model=FamilyTreeResponse)
def create_tree(
    tree_data: FamilyTreeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée un nouvel arbre généalogique avec une personne racine"""
    
    # Créer l'arbre
    new_tree = FamilyTree(
        name=tree_data.name,
        description=tree_data.description,
        is_public=tree_data.is_public,
        owner_id=current_user.id
    )
    
    db.add(new_tree)
    db.commit()
    db.refresh(new_tree)
    
    # Créer une personne racine par défaut
    root_person = Person(
        first_name="Personne",
        last_name="Racine",
        tree_id=new_tree.id
    )
    
    db.add(root_person)
    db.commit()
    
    return FamilyTreeResponse.from_orm(new_tree)


@router.put("/{tree_id}", response_model=FamilyTreeResponse)
def update_tree(
    tree_id: str,
    tree_data: FamilyTreeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour un arbre généalogique"""
    tree = check_tree_ownership(tree_id, current_user, db)
    
    # Mettre à jour les champs fournis
    if tree_data.name is not None:
        tree.name = tree_data.name
    if tree_data.description is not None:
        tree.description = tree_data.description
    if tree_data.is_public is not None:
        tree.is_public = tree_data.is_public
    
    db.commit()
    db.refresh(tree)
    
    return FamilyTreeResponse.from_orm(tree)


@router.delete("/{tree_id}")
def delete_tree(
    tree_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime un arbre généalogique"""
    tree = check_tree_ownership(tree_id, current_user, db)
    
    db.delete(tree)
    db.commit()
    
    return {"message": "Arbre généalogique supprimé avec succès"}
