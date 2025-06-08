#!/bin/bash

echo "🔧 TEST CORRECTION RECHARGEMENT"
echo "==============================="

cd /Users/kader/Desktop/projet-en-cours/geneaIA

echo "🚀 Redémarrage de l'application..."
docker-compose restart

echo "⏳ Attente du redémarrage..."
sleep 5

echo ""
echo "🧪 INSTRUCTIONS DE TEST:"
echo "========================"
echo ""
echo "1. Ouvrir: http://localhost:5173"
echo "2. Console F12 ouverte"
echo "3. Créer deux parents pour un enfant"
echo "4. ✅ Vérifier que la ligne verte apparaît"
echo "5. 🔄 RECHARGER LA PAGE (F5)"
echo "6. ✅ Vérifier que la ligne verte RESTE visible"
echo ""
echo "🔍 NOUVEAUX LOGS À SURVEILLER:"
echo "============================="
echo ""
echo "Au rechargement:"
echo "  🎨 RECALCUL DES ARÊTES STYLÉES, edges.length: 51"
echo "  👶 Enfants pour le mariage abc12345...: 1"
echo "  🔄 FORCER LE RAFRAÎCHISSEMENT DE REACTFLOW..."
echo ""
echo "✅ SI LA LIGNE VERTE RESTE VISIBLE:"
echo "   → Problème résolu ! 🎉"
echo ""
echo "❌ SI LA LIGNE VERTE DISPARAÎT ENCORE:"
echo "   → Problème plus profond dans ReactFlow"
echo ""

# Ouvrir automatiquement le navigateur si possible
if command -v open &> /dev/null; then
    echo "🌐 Ouverture automatique du navigateur..."
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    echo "🌐 Ouverture automatique du navigateur..."
    xdg-open http://localhost:5173
fi

echo "🎯 Prêt pour le test de persistance visuelle !"