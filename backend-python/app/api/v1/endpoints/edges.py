"""
Routes des liens (edges)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.edge import EdgeCreate, EdgeUpdate, EdgeResponse
from app.models.edge import Edge
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


def check_edge_access(edge_id: str, user: User, db: Session) -> Edge:
    """Vérifie que l'utilisateur peut accéder à ce lien"""
    edge = db.query(Edge).filter(Edge.id == edge_id).first()
    if not edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lien non trouvé"
        )
    
    tree = db.query(FamilyTree).filter(FamilyTree.id == edge.tree_id).first()
    if tree.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit à ce lien"
        )
    
    return edge


@router.get("/tree/{tree_id}", response_model=List[EdgeResponse])
def get_tree_edges(
    tree_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les liens d'un arbre"""
    check_tree_access(tree_id, current_user, db)
    
    edges = db.query(Edge).filter(Edge.tree_id == tree_id).all()
    return [EdgeResponse.from_orm(edge) for edge in edges]


@router.post("/", response_model=EdgeResponse)
def create_edge(
    edge_data: EdgeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée un nouveau lien"""
    check_tree_access(edge_data.tree_id, current_user, db)
    
    new_edge = Edge(
        source=edge_data.source,
        target=edge_data.target,
        type=edge_data.type,
        source_handle=edge_data.source_handle,
        target_handle=edge_data.target_handle,
        data=edge_data.data,
        tree_id=edge_data.tree_id
    )
    
    db.add(new_edge)
    db.commit()
    db.refresh(new_edge)
    
    return EdgeResponse.from_orm(new_edge)


@router.put("/{edge_id}", response_model=EdgeResponse)
def update_edge(
    edge_id: str,
    edge_data: EdgeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour un lien"""
    edge = check_edge_access(edge_id, current_user, db)
    
    # Mettre à jour les champs fournis
    update_data = edge_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(edge, field, value)
    
    db.commit()
    db.refresh(edge)
    
    return EdgeResponse.from_orm(edge)


@router.delete("/{edge_id}")
def delete_edge(
    edge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime un lien"""
    edge = check_edge_access(edge_id, current_user, db)
    
    db.delete(edge)
    db.commit()
    
    return {"message": "Lien supprimé avec succès"}
