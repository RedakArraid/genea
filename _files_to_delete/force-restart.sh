#!/bin/bash

echo "🚨 REDÉMARRAGE FORCÉ DU SERVEUR BACKEND"
echo "====================================="

# Aller dans le répertoire du projet
cd /Users/kader/Desktop/projet-en-cours/geneaIA

echo "1. 🛑 Arrêt forcé de tous les processus Node.js..."
# Tuer tous les processus node
pkill -f node 2>/dev/null || true
pkill -f npm 2>/dev/null || true

# Tuer spécifiquement le port 3001
echo "2. 🔍 Libération du port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Attendre un peu
echo "3. ⏳ Attente de 3 secondes..."
sleep 3

# Vérifier que le port est libre
echo "4. ✅ Vérification que le port 3001 est libre..."
if lsof -i:3001 > /dev/null 2>&1; then
    echo "❌ Le port 3001 est encore occupé. Tentative de libération forcée..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 2
else
    echo "✅ Port 3001 libéré avec succès"
fi

# Aller dans le dossier backend
echo "5. 📁 Navigation vers le dossier backend..."
cd backend

# Nettoyer le cache npm
echo "6. 🧹 Nettoyage du cache npm..."
npm cache clean --force 2>/dev/null || true

# Nettoyer node_modules si nécessaire (optionnel)
echo "7. 🔄 Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

echo "8. 🚀 Démarrage du serveur..."
echo "   Le serveur va démarrer avec les corrections appliquées..."
echo "   Vous devriez voir les logs de debug que nous avons ajoutés."
echo ""
echo "🔍 POINTS À VÉRIFIER DANS LES LOGS:"
echo "   - 'Requête de mise à jour reçue pour la personne ID'"
echo "   - 'birthDate reçu: ... type: ...'"
echo "   - 'birthDate traité: ...'"
echo ""

# Démarrer le serveur
npm start

echo ""
echo "❌ Si le serveur ne démarre pas, vérifiez:"
echo "   1. Que vous êtes dans le bon répertoire"
echo "   2. Que les dépendances sont installées (npm install)"
echo "   3. Que le fichier .env existe et est configuré"
echo "   4. Que la base de données est accessible"
