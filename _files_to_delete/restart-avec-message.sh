#!/bin/bash

echo "🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥"
echo "🚀 REDÉMARRAGE BACKEND AVEC VERSION CORRIGÉE 🚀"
echo "🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥"

# Aller dans le répertoire du projet
cd /Users/kader/Desktop/projet-en-cours/geneaIA

echo ""
echo "1. 🛑 Arrêt forcé de tous les processus Node.js..."
# Tuer tous les processus node
pkill -f node 2>/dev/null || true
pkill -f npm 2>/dev/null || true
pkill -f nodemon 2>/dev/null || true

echo "2. 🔍 Libération du port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "3. ⏳ Attente de 3 secondes pour nettoyer..."
sleep 3

echo "4. ✅ Vérification que le port 3001 est libre..."
if lsof -i:3001 > /dev/null 2>&1; then
    echo "❌ Le port 3001 est encore occupé. Nouvelle tentative..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 2
    if lsof -i:3001 > /dev/null 2>&1; then
        echo "🔴 PROBLÈME: Le port 3001 refuse de se libérer"
        echo "   Vous devrez peut-être redémarrer votre machine"
        exit 1
    fi
fi
echo "✅ Port 3001 libéré avec succès"

echo "5. 📁 Navigation vers le dossier backend..."
cd backend

echo "6. 🚀 Démarrage du serveur avec la version corrigée..."
echo ""
echo "🔍 VOUS DEVRIEZ VOIR CES MESSAGES SI LA CORRECTION EST ACTIVE:"
echo "   🎉 'ON EST EN BACK - VERSION CORRIGÉE !'"
echo "   🚀 'UPDATE PERSON - VERSION CORRIGÉE ACTIVE !'"
echo ""
echo "🚀 Démarrage en cours..."
echo ""

# Démarrer le serveur
npm start
