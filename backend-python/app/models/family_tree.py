"""
Modèle FamilyTree
"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import uuid


class FamilyTree(Base):
    __tablename__ = "family_trees"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    owner = relationship("User", back_populates="family_trees")
    persons = relationship("Person", back_populates="family_tree", cascade="all, delete-orphan")
    node_positions = relationship("NodePosition", back_populates="family_tree", cascade="all, delete-orphan")
    edges = relationship("Edge", back_populates="family_tree", cascade="all, delete-orphan")
