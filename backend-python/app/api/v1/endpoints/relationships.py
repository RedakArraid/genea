"""
Routes des relations
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.relationship import RelationshipCreate, RelationshipResponse
from app.models.relationship import Relationship
from app.models.person import Person
from app.models.family_tree import FamilyTree
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter()


def check_relationship_access(relationship_id: str, user: User, db: Session) -> Relationship:
    """Vérifie que l'utilisateur peut accéder à cette relation"""
    relationship = db.query(Relationship).filter(Relationship.id == relationship_id).first()
    if not relationship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relation non trouvée"
        )
    
    # Vérifier que l'utilisateur est propriétaire de l'arbre via la personne source
    source_person = db.query(Person).filter(Person.id == relationship.source_id).first()
    tree = db.query(FamilyTree).filter(FamilyTree.id == source_person.tree_id).first()
    
    if tree.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit à cette relation"
        )
    
    return relationship


def create_inverse_relationship(relationship_type: str, source_id: str, target_id: str) -> dict:
    """Crée la relation inverse"""
    inverse_mapping = {
        "parent": {"type": "child", "source": target_id, "target": source_id},
        "child": {"type": "parent", "source": target_id, "target": source_id},
        "spouse": {"type": "spouse", "source": target_id, "target": source_id},
        "sibling": {"type": "sibling", "source": target_id, "target": source_id}
    }
    
    return inverse_mapping.get(relationship_type)


@router.get("/person/{person_id}", response_model=List[RelationshipResponse])
def get_person_relationships(
    person_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère toutes les relations d'une personne"""
    
    # Vérifier l'accès à la personne
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personne non trouvée"
        )
    
    tree = db.query(FamilyTree).filter(FamilyTree.id == person.tree_id).first()
    if tree.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit à cette personne"
        )
    
    # Récupérer toutes les relations où la personne est source ou cible
    relationships = db.query(Relationship).filter(
        (Relationship.source_id == person_id) | (Relationship.target_id == person_id)
    ).all()
    
    return [RelationshipResponse.from_orm(rel) for rel in relationships]


@router.post("/", response_model=RelationshipResponse)
def create_relationship(
    relationship_data: RelationshipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée une nouvelle relation"""
    
    # Vérifier que les deux personnes existent et appartiennent au même arbre
    source_person = db.query(Person).filter(Person.id == relationship_data.source_id).first()
    target_person = db.query(Person).filter(Person.id == relationship_data.target_id).first()
    
    if not source_person or not target_person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Une ou plusieurs personnes non trouvées"
        )
    
    if source_person.tree_id != target_person.tree_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les deux personnes doivent appartenir au même arbre généalogique"
        )
    
    # Vérifier l'accès à l'arbre
    tree = db.query(FamilyTree).filter(FamilyTree.id == source_person.tree_id).first()
    if tree.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit à cet arbre généalogique"
        )
    
    # Vérifier que la relation n'existe pas déjà
    existing_relationship = db.query(Relationship).filter(
        Relationship.source_id == relationship_data.source_id,
        Relationship.target_id == relationship_data.target_id,
        Relationship.type == relationship_data.type
    ).first()
    
    if existing_relationship:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette relation existe déjà"
        )
    
    # Créer la relation principale
    new_relationship = Relationship(
        type=relationship_data.type,
        source_id=relationship_data.source_id,
        target_id=relationship_data.target_id
    )
    
    db.add(new_relationship)
    
    # Créer la relation inverse pour spouse et sibling
    if relationship_data.type in ["spouse", "sibling"]:
        inverse_data = create_inverse_relationship(
            relationship_data.type,
            relationship_data.source_id,
            relationship_data.target_id
        )
        
        if inverse_data:
            # Vérifier que la relation inverse n'existe pas déjà
            existing_inverse = db.query(Relationship).filter(
                Relationship.source_id == inverse_data["source"],
                Relationship.target_id == inverse_data["target"],
                Relationship.type == inverse_data["type"]
            ).first()
            
            if not existing_inverse:
                inverse_relationship = Relationship(
                    type=inverse_data["type"],
                    source_id=inverse_data["source"],
                    target_id=inverse_data["target"]
                )
                db.add(inverse_relationship)
    
    db.commit()
    db.refresh(new_relationship)
    
    return RelationshipResponse.from_orm(new_relationship)


@router.delete("/{relationship_id}")
def delete_relationship(
    relationship_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime une relation"""
    relationship = check_relationship_access(relationship_id, current_user, db)
    
    # Supprimer aussi la relation inverse si c'est spouse ou sibling
    if relationship.type in ["spouse", "sibling"]:
        inverse_relationship = db.query(Relationship).filter(
            Relationship.source_id == relationship.target_id,
            Relationship.target_id == relationship.source_id,
            Relationship.type == relationship.type
        ).first()
        
        if inverse_relationship:
            db.delete(inverse_relationship)
    
    db.delete(relationship)
    db.commit()
    
    return {"message": "Relation supprimée avec succès"}
