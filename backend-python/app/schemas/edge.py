"""
Schémas Pydantic pour Edge
"""

from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime


class EdgeBase(BaseModel):
    source: str
    target: str
    type: Optional[str] = None
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class EdgeCreate(EdgeBase):
    tree_id: str


class EdgeUpdate(BaseModel):
    source: Optional[str] = None
    target: Optional[str] = None
    type: Optional[str] = None
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class EdgeResponse(EdgeBase):
    id: str
    tree_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
