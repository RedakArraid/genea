"""
Modèle Relationship
"""

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import uuid


class Relationship(Base):
    __tablename__ = "relationships"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String, nullable=False)  # parent, child, spouse, sibling
    source_id = Column(String, ForeignKey("persons.id"), nullable=False)
    target_id = Column(String, ForeignKey("persons.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    source_person = relationship(
        "Person", 
        foreign_keys=[source_id],
        back_populates="source_relationships"
    )
    target_person = relationship(
        "Person", 
        foreign_keys=[target_id],
        back_populates="target_relationships"
    )
