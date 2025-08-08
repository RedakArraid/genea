"""
Modèle Edge
"""

from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import uuid


class Edge(Base):
    __tablename__ = "edges"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String, nullable=False)
    target = Column(String, nullable=False)
    type = Column(String, nullable=True)
    source_handle = Column(String, nullable=True)
    target_handle = Column(String, nullable=True)
    data = Column(JSON, nullable=True)
    tree_id = Column(String, ForeignKey("family_trees.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    family_tree = relationship("FamilyTree", back_populates="edges")
