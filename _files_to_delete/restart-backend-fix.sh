#!/bin/bash

echo "🔄 Redémarrage du serveur backend après correction du bug de date..."

# Aller dans le dossier backend
cd /Users/kader/Desktop/projet-en-cours/geneaIA/backend

echo "📋 Arrêt des processus Node.js existants..."
# Tuer tous les processus node qui pourraient tourner sur le port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "🧹 Nettoyage du cache npm..."
npm cache clean --force 2>/dev/null || true

echo "🚀 Redémarrage du serveur..."
npm start

echo "✅ Serveur redémarré ! Vous pouvez maintenant tester la modification des dates de naissance."
