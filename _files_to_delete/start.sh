#!/bin/bash

# Script de démarrage pour l'application GeneaIA
# Ce script démarre le serveur backend et frontend

# Fonction pour la gestion des erreurs
error_exit() {
  echo "Error: $1" >&2
  exit 1
}

# Vérifier si les répertoires nécessaires existent
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  error_exit "Les répertoires 'backend' et 'frontend' doivent exister."
fi

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
  error_exit "Node.js n'est pas installé. Veuillez installer Node.js pour exécuter cette application."
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
  error_exit "npm n'est pas installé. Veuillez installer npm pour exécuter cette application."
fi

# Installer les dépendances du backend si node_modules n'existe pas
if [ ! -d "backend/node_modules" ]; then
  echo "Installation des dépendances du backend..."
  cd backend && npm install || error_exit "Échec de l'installation des dépendances du backend"
  cd ..
fi

# Générer le client Prisma
echo "Génération du client Prisma..."
cd backend && npx prisma generate || error_exit "Échec de la génération du client Prisma"
cd ..

# Installer les dépendances du frontend si node_modules n'existe pas
if [ ! -d "frontend/node_modules" ]; then
  echo "Installation des dépendances du frontend..."
  cd frontend && npm install || error_exit "Échec de l'installation des dépendances du frontend"
  cd ..
fi

# Démarrer le serveur backend
echo "Démarrage du serveur backend..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
echo "Attente du démarrage du backend..."
sleep 3

# Démarrer le serveur frontend
echo "Démarrage du serveur frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

# Fonction pour arrêter les serveurs lors de la sortie du script
cleanup() {
  echo "Arrêt des serveurs..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Capture des signaux pour arrêter proprement les serveurs
trap cleanup SIGINT SIGTERM

echo "GeneaIA est en cours d'exécution!"
echo "Backend URL: http://localhost:3001"
echo "Frontend URL: http://localhost:5173"
echo "Appuyez sur Ctrl+C pour arrêter les serveurs"

# Maintenir le script en cours d'exécution
wait