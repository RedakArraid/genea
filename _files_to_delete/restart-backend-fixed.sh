#!/bin/bash

echo "🔧 CORRECTION DÉFINITIVE de l'erreur birthDate.trim"
echo "=================================================="

echo "1. 🛑 Arrêt forcé de tous les processus Node.js..."
pkill -f "node" 2>/dev/null || echo "Aucun processus Node trouvé"
sleep 2

echo "2. 🧹 Nettoyage des ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "Port 3001 libre"
sleep 1

echo "3. 📍 Positionnement dans le dossier backend..."
cd /Users/kader/Desktop/projet-en-cours/geneaIA/backend

echo "4. 🔍 Vérification des corrections dans person.routes.js..."
if grep -q "\.toDate()" src/routes/person.routes.js; then
    echo "❌ ERREUR: .toDate() encore présent dans person.routes.js"
    echo "   Correction nécessaire avant redémarrage"
    exit 1
else
    echo "✅ .toDate() supprimé de person.routes.js"
fi

echo "5. 🔍 Vérification des corrections dans person.controller.js..."
if grep -q "getBirthDateValue" src/controllers/person.controller.js; then
    echo "✅ Fonctions utilitaires présentes dans person.controller.js"
else
    echo "❌ ERREUR: Fonctions utilitaires manquantes"
    exit 1
fi

echo "6. 🚀 Redémarrage du backend avec corrections..."
npm run dev &
BACKEND_PID=$!

echo "✅ Backend redémarré (PID: $BACKEND_PID)"
echo ""
echo "📊 RÉSUMÉ DES CORRECTIONS:"
echo "- ❌ .toDate() supprimé des validators express-validator"
echo "- ✅ getBirthDateValue() et getDeathDateValue() dans le contrôleur"
echo "- ✅ Validation sécurisée des types dans EditPersonModal"
echo "- ✅ Frontend et Backend corrigés"
echo ""
echo "🧪 TESTEZ MAINTENANT:"
echo "1. Modifiez une personne existante"
echo "2. Changez sa date de naissance"
echo "3. L'erreur 'birthDate.trim is not a function' devrait être RÉSOLUE"
echo ""
echo "Pour arrêter le backend: kill $BACKEND_PID"
