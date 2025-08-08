"""
Schémas Pydantic pour Person
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PersonBase(BaseModel):
    first_name: str
    last_name: str
    birth_date: Optional[datetime] = None
    birth_place: Optional[str] = None
    death_date: Optional[datetime] = None
    occupation: Optional[str] = None
    biography: Optional[str] = None
    gender: Optional[str] = None  # male, female, other
    photo_url: Optional[str] = None


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[datetime] = None
    birth_place: Optional[str] = None
    death_date: Optional[datetime] = None
    occupation: Optional[str] = None
    biography: Optional[str] = None
    gender: Optional[str] = None
    photo_url: Optional[str] = None


class PersonResponse(PersonBase):
    id: str
    tree_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
