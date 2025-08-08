"""
Routes des personnes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.person import PersonCreate, PersonUpdate, PersonResponse
from app.models.person import Person
from app.models.family_tree import FamilyTree
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter()


def check_person_access(person_id: str, user: User, db: Session) -> Person:
    """Vérifie que l'utilisateur peut accéder à cette personne"""
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personne non trouvée"
        )
    
    # Vérifier que l'utilisateur est propriétaire de l'arbre
    tree = db.query(FamilyTree).filter(FamilyTree.id == person.tree_id).first()
    if tree.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès interdit à cette personne"
        )
    
    return person


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


@router.get("/tree/{tree_id}", response_model=List[PersonResponse])
def get_persons_in_tree(
    tree_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère toutes les personnes d'un arbre"""
    check_tree_access(tree_id, current_user, db)
    
    persons = db.query(Person).filter(Person.tree_id == tree_id).all()
    return [PersonResponse.from_orm(person) for person in persons]


@router.get("/{person_id}", response_model=PersonResponse)
def get_person(
    person_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère une personne spécifique"""
    person = check_person_access(person_id, current_user, db)
    return PersonResponse.from_orm(person)


@router.post("/tree/{tree_id}", response_model=PersonResponse)
def create_person(
    tree_id: str,
    person_data: PersonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée une nouvelle personne dans un arbre"""
    check_tree_access(tree_id, current_user, db)
    
    # Validation des dates
    if (person_data.birth_date and person_data.death_date and 
        person_data.birth_date > person_data.death_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La date de naissance ne peut pas être postérieure à la date de décès"
        )
    
    # Validation du genre
    if person_data.gender and person_data.gender not in ["male", "female", "other"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le genre doit être 'male', 'female' ou 'other'"
        )
    
    new_person = Person(
        **person_data.dict(),
        tree_id=tree_id
    )
    
    db.add(new_person)
    db.commit()
    db.refresh(new_person)
    
    return PersonResponse.from_orm(new_person)


@router.put("/{person_id}", response_model=PersonResponse)
def update_person(
    person_id: str,
    person_data: PersonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour une personne"""
    person = check_person_access(person_id, current_user, db)
    
    # Mettre à jour les champs fournis
    update_data = person_data.dict(exclude_unset=True)
    
    # Validation des dates si fournies
    birth_date = update_data.get("birth_date", person.birth_date)
    death_date = update_data.get("death_date", person.death_date)
    
    if birth_date and death_date and birth_date > death_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La date de naissance ne peut pas être postérieure à la date de décès"
        )
    
    # Validation du genre si fourni
    if "gender" in update_data and update_data["gender"] not in ["male", "female", "other"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le genre doit être 'male', 'female' ou 'other'"
        )
    
    for field, value in update_data.items():
        setattr(person, field, value)
    
    db.commit()
    db.refresh(person)
    
    return PersonResponse.from_orm(person)


@router.delete("/{person_id}")
def delete_person(
    person_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime une personne"""
    person = check_person_access(person_id, current_user, db)
    
    db.delete(person)
    db.commit()
    
    return {"message": "Personne supprimée avec succès"}
