"""
Router principal de l'API v1
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, family_trees, persons, relationships, node_positions, edges

api_router = APIRouter()

# Inclusion des routes
api_router.include_router(auth.router, prefix="/auth", tags=["authentification"])
api_router.include_router(users.router, prefix="/users", tags=["utilisateurs"])
api_router.include_router(family_trees.router, prefix="/family-trees", tags=["arbres généalogiques"])
api_router.include_router(persons.router, prefix="/persons", tags=["personnes"])
api_router.include_router(relationships.router, prefix="/relationships", tags=["relations"])
api_router.include_router(node_positions.router, prefix="/node-positions", tags=["positions"])
api_router.include_router(edges.router, prefix="/edges", tags=["liens"])
