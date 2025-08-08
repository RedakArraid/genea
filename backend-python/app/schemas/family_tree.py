"""
Schémas Pydantic pour FamilyTree
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.person import PersonResponse
from app.schemas.node_position import NodePositionResponse
from app.schemas.edge import EdgeResponse


class FamilyTreeBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False


class FamilyTreeCreate(FamilyTreeBase):
    pass


class FamilyTreeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class FamilyTreeResponse(FamilyTreeBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FamilyTreeDetailResponse(FamilyTreeResponse):
    persons: List[PersonResponse] = []
    node_positions: List[NodePositionResponse] = []
    edges: List[EdgeResponse] = []
