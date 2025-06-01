#!/bin/bash

echo "🔄 Redémarrage du backend seulement..."

# Aller dans le dossier backend
cd /Users/kader/Desktop/projet-en-cours/geneaIA/backend

# Tuer tous les processus Node.js qui pourraient tourner sur le port 3001
echo "🛑 Arrêt des processus existants..."
pkill -f "node.*3001" 2>/dev/null || echo "Aucun processus Node.js sur le port 3001"
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Port 3001 libéré"

# Attendre un peu
sleep 2

# Redémarrer le backend
echo "🚀 Redémarrage du backend..."
npm run dev

echo "✅ Backend redémarré avec les corrections !"
