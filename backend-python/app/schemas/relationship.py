"""
Schémas Pydantic pour Relationship
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RelationshipBase(BaseModel):
    type: str  # parent, child, spouse, sibling
    source_id: str
    target_id: str


class RelationshipCreate(RelationshipBase):
    pass


class RelationshipResponse(RelationshipBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
