#!/bin/bash

echo "🔍 DIAGNOSTIC - État du serveur backend après corrections"
echo "========================================================="

# Vérifier si le serveur tourne sur le port 3001
echo "1. Vérification du port 3001..."
if lsof -i:3001 > /dev/null 2>&1; then
    echo "✅ Le serveur tourne sur le port 3001"
    echo "📋 Processus en cours:"
    lsof -i:3001
else
    echo "❌ Aucun serveur ne tourne sur le port 3001"
fi

echo ""
echo "2. Vérification des fichiers modifiés..."

# Vérifier si nos modifications sont bien présentes
echo "🔍 Vérification de person.controller.js..."
if grep -q "birthDate ? new Date(birthDate) : null" "/Users/kader/Desktop/projet-en-cours/geneaIA/backend/src/controllers/person.controller.js"; then
    echo "✅ Modifications du contrôleur présentes"
else
    echo "❌ Modifications du contrôleur MANQUANTES"
fi

echo "🔍 Vérification de person.routes.js..."
if grep -q "optional().isISO8601().toDate()" "/Users/kader/Desktop/projet-en-cours/geneaIA/backend/src/routes/person.routes.js"; then
    echo "✅ Modifications des routes présentes"
else
    echo "❌ Modifications des routes MANQUANTES"
fi

echo ""
echo "3. Test de connexion à l'API..."
if curl -s -o /dev/null -w "%{http_code}" http://168.231.86.179:3001 | grep -q "200\|404"; then
    echo "✅ Le serveur répond"
else
    echo "❌ Le serveur ne répond pas"
fi

echo ""
echo "========================================================="
echo "💡 INSTRUCTIONS:"
echo ""
echo "Si le serveur tourne mais que les modifications ne sont pas actives:"
echo "1. Arrêter complètement le serveur (Ctrl+C)"
echo "2. Attendre 5 secondes"
echo "3. Redémarrer avec: cd backend && npm start"
echo ""
echo "Si le serveur ne tourne pas:"
echo "1. cd /Users/kader/Desktop/projet-en-cours/geneaIA/backend"
echo "2. npm start"
echo ""
echo "Si les modifications sont manquantes:"
echo "1. Vérifier les fichiers person.controller.js et person.routes.js"
echo "2. Réappliquer les corrections si nécessaire"
