"""
Configuration de l'application
"""

from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Configuration de l'application"""
    
    # Configuration du serveur
    HOST: str = "0.0.0.0"
    PORT: int = 3001
    ENVIRONMENT: str = "development"
    
    # Configuration de la base de données
    DATABASE_URL: str = "postgresql://kader:kader@localhost:5432/genea"
    
    # Configuration JWT
    JWT_SECRET_KEY: str = "dev-secret-key-for-local-development-only"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24 * 7  # 7 jours
    
    # Configuration CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:8080"
    ]
    
    # Configuration de l'upload
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "uploads"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
