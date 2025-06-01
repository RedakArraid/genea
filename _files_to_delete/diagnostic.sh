#!/bin/bash

echo "🔍 Diagnostic du problème backend"
echo "================================"

echo "1. 📍 Vérification du répertoire actuel:"
pwd

echo ""
echo "2. 🔍 Recherche de processus Node.js en cours:"
ps aux | grep node | grep -v grep

echo ""
echo "3. 🔍 Processus utilisant le port 3001:"
lsof -i :3001 2>/dev/null || echo "Aucun processus sur le port 3001"

echo ""
echo "4. 📁 Vérification des fichiers backend:"
if [ -f "/Users/kader/Desktop/projet-en-cours/geneaIA/backend/src/controllers/person.controller.js" ]; then
    echo "✅ person.controller.js existe"
    grep -n "getBirthDateValue" /Users/kader/Desktop/projet-en-cours/geneaIA/backend/src/controllers/person.controller.js | head -1
else
    echo "❌ person.controller.js non trouvé"
fi

echo ""
echo "5. 🔧 Actions recommandées:"
echo "   - Aller dans le dossier backend"
echo "   - Arrêter le serveur existant (Ctrl+C dans le terminal du backend)"
echo "   - Redémarrer avec: npm run dev"

echo ""
echo "6. 🚀 Ou utiliser le script automatique:"
echo "   chmod +x restart-backend.sh"
echo "   ./restart-backend.sh"
