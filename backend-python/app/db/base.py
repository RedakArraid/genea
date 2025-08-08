"""
Import de tous les modèles pour que Base.metadata les connaisse
"""

from app.db.session import Base
from app.models.user import User
from app.models.family_tree import FamilyTree
from app.models.person import Person
from app.models.relationship import Relationship
from app.models.node_position import NodePosition
from app.models.edge import Edge

# SQLAlchemy utilise cette import pour créer les tables
__all__ = ["Base"]
