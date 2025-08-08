"""
Routes des positions de nœuds
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.node_position import NodePositionCreate, NodePositionUpdate, NodePositionResponse
from app.models.node_position import NodePosition
from app.models.family_tree import FamilyTree
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter()


def check_tree_access(tree_id: str, user: User, db: Session) -> FamilyTree:
    """Vérifie que l'utilisateur peut accéder à cet arbre"""
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


def check_position_access(position_id: str, user: User, db: Session) -> NodePosition:
    """Vérifie que l'utilisateur peut accéder à cette position"""
    position = db.query(NodePosition).filter(NodePosition.id == position_id).first()
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position non trouvée"
        )
    
    tree = db.query(FamilyTree).filter(FamilyTree.id == position.tree_id).first()
    if tree.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit à cette position"
        )
    
    return position


@router.get("/tree/{tree_id}", response_model=List[NodePositionResponse])
def get_tree_positions(
    tree_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère toutes les positions de nœuds d'un arbre"""
    check_tree_access(tree_id, current_user, db)
    
    positions = db.query(NodePosition).filter(NodePosition.tree_id == tree_id).all()
    return [NodePositionResponse.from_orm(position) for position in positions]


@router.post("/", response_model=NodePositionResponse)
def create_or_update_position(
    position_data: NodePositionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée ou met à jour une position de nœud"""
    check_tree_access(position_data.tree_id, current_user, db)
    
    # Vérifier si la position existe déjà pour ce nœud
    existing_position = db.query(NodePosition).filter(
        NodePosition.node_id == position_data.node_id,
        NodePosition.tree_id == position_data.tree_id
    ).first()
    
    if existing_position:
        # Mettre à jour la position existante
        existing_position.x = position_data.x
        existing_position.y = position_data.y
        db.commit()
        db.refresh(existing_position)
        return NodePositionResponse.from_orm(existing_position)
    else:
        # Créer une nouvelle position
        new_position = NodePosition(
            node_id=position_data.node_id,
            x=position_data.x,
            y=position_data.y,
            tree_id=position_data.tree_id
        )
        
        db.add(new_position)
        db.commit()
        db.refresh(new_position)
        
        return NodePositionResponse.from_orm(new_position)


@router.put("/{position_id}", response_model=NodePositionResponse)
def update_position(
    position_id: str,
    position_data: NodePositionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour une position de nœud"""
    position = check_position_access(position_id, current_user, db)
    
    # Mettre à jour les champs fournis
    if position_data.x is not None:
        position.x = position_data.x
    if position_data.y is not None:
        position.y = position_data.y
    
    db.commit()
    db.refresh(position)
    
    return NodePositionResponse.from_orm(position)


@router.delete("/{position_id}")
def delete_position(
    position_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime une position de nœud"""
    position = check_position_access(position_id, current_user, db)
    
    db.delete(position)
    db.commit()
    
    return {"message": "Position supprimée avec succès"}
