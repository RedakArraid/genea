"""
Schémas Pydantic pour NodePosition
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NodePositionBase(BaseModel):
    node_id: str
    x: float
    y: float


class NodePositionCreate(NodePositionBase):
    tree_id: str


class NodePositionUpdate(BaseModel):
    x: Optional[float] = None
    y: Optional[float] = None


class NodePositionResponse(NodePositionBase):
    id: str
    tree_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
