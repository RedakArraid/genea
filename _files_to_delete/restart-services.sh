#!/bin/bash

# Script pour redémarrer les services geneaIA après les corrections

echo "🔄 Redémarrage des services geneaIA"
echo "=================================="

# Aller dans le répertoire backend
cd backend

echo "📦 Backend - Installation des dépendances (si nécessaire)..."
npm install

echo "🚀 Backend - Redémarrage du serveur..."
# Tuer le processus existant sur le port 3001 s'il existe
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Aucun processus sur le port 3001"

# Démarrer le backend en arrière-plan
npm run dev &
BACKEND_PID=$!

echo "✅ Backend démarré (PID: $BACKEND_PID)"

# Attendre que le backend soit prêt
echo "⏳ Attente du démarrage complet du backend..."
sleep 5

# Aller dans le répertoire frontend
cd ../frontend

echo "📦 Frontend - Installation des dépendances (si nécessaire)..."
npm install

echo "🚀 Frontend - Redémarrage du serveur..."
# Tuer le processus existant sur le port 5173 s'il existe
lsof -ti:5173 | xargs kill -9 2>/dev/null || echo "Aucun processus sur le port 5173"

# Démarrer le frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Frontend démarré (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Services redémarrés avec succès !"
echo "======================================"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Pour arrêter les services :"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📝 Testez maintenant l'ajout/modification de personnes avec des dates"
echo "L'erreur 'birthDate.trim is not a function' devrait être résolue !"
