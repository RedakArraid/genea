"""
Point d'entrée principal de l'API GeneaIA en Python
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from datetime import datetime
import socket
import platform

from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine
from app.db.base import Base

# Création de l'application FastAPI
app = FastAPI(
    title="GeneaIA API",
    description="API pour l'application de généalogie GeneaIA",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Événements au démarrage de l'application"""
    print("🚀 Démarrage de l'API GeneaIA Python...")


@app.on_event("shutdown")
async def shutdown_event():
    """Événements à l'arrêt de l'application"""
    print("🛑 Arrêt de l'API GeneaIA Python...")


@app.get("/")
async def root():
    """Route racine"""
    return {"message": "Bienvenue sur l'API GeneaIA (Python)"}


@app.get("/health")
async def health_check():
    """Health check complet"""
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    return {
        "status": "OK",
        "message": "GeneaIA API Python is running",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "host": settings.HOST,
        "port": settings.PORT,
        "database": "Connected",
        "server_info": {
            "hostname": hostname,
            "platform": platform.system(),
            "ip_addresses": [local_ip]
        },
        "accessible_via": [
            f"http://localhost:{settings.PORT}",
            f"http://{local_ip}:{settings.PORT}"
        ]
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Gestionnaire global d'exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Une erreur interne est survenue",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else None
        }
    )


# Inclusion des routes API
app.include_router(api_router, prefix="/api")


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development"
    )
