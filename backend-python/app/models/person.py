"""
Modèle Person
"""

from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import uuid


class Person(Base):
    __tablename__ = "persons"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    birth_date = Column(DateTime, nullable=True)
    birth_place = Column(String, nullable=True)
    death_date = Column(DateTime, nullable=True)
    occupation = Column(String, nullable=True)
    biography = Column(Text, nullable=True)
    gender = Column(String, nullable=True)  # male, female, other
    photo_url = Column(String, nullable=True)
    tree_id = Column(String, ForeignKey("family_trees.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    family_tree = relationship("FamilyTree", back_populates="persons")
    
    # Relations pour les relationships
    source_relationships = relationship(
        "Relationship", 
        foreign_keys="Relationship.source_id",
        back_populates="source_person",
        cascade="all, delete-orphan"
    )
    target_relationships = relationship(
        "Relationship", 
        foreign_keys="Relationship.target_id",
        back_populates="target_person",
        cascade="all, delete-orphan"
    )
