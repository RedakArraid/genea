#!/bin/bash

echo "🔍 DEBUG RECHARGEMENT - Persistance des relations"
echo "============================================="

cd /Users/kader/Desktop/projet-en-cours/geneaIA

echo "⏹️  Arrêt de l'application..."
docker-compose down

echo "🚀 Redémarrage avec logs de persistance..."
docker-compose up -d

echo "⏳ Attente du démarrage..."
sleep 5

echo ""
echo "🎯 PROBLÈME À DIAGNOSTIQUER:"
echo "============================"
echo ""
echo "❌ Les lignes visuelles disparaissent au rechargement de la page"
echo ""
echo "🔍 CAUSES POSSIBLES:"
echo "==================="
echo ""
echo "1. 📊 DONNÉES BACKEND:"
echo "   - Les relations marriage_child_connection ne sont pas sauvegardées"
echo "   - Le champ 'data' n'est pas persisté correctement"
echo "   - Le marriageEdgeId est perdu"
echo ""
echo "2. 🔄 CHARGEMENT FRONTEND:"
echo "   - Les arêtes ne sont pas récupérées correctement"
echo "   - Le type marriage_child_connection n'est pas reconnu"
echo "   - Problème dans la transformation des données"
echo ""
echo "🧪 INSTRUCTIONS DE TEST:"
echo "========================"
echo ""
echo "1. Ouvrir: http://localhost:5173"
echo "2. Console F12"
echo "3. Créer deux parents pour un enfant (vérifier que ça marche)"
echo "4. RECHARGER LA PAGE (F5 ou Ctrl+R)"
echo "5. Vérifier les logs dans la console:"
echo ""
echo "LOGS À SURVEILLER:"
echo ""
echo "Au chargement:"
echo "  🔄 Chargement de l'arbre: [tree-id]"
echo "  🌳 ARBRE RÉCUPÉRÉ DU BACKEND: {...}"
echo "  🌳 Arêtes dans l'arbre: [nombre]"
echo "  🔗 ARÊTE RÉCUPÉRÉE: {...dataType: marriage_child_connection...}"
echo "  🔗 Arêtes marriage_child_connection finales: [nombre]"
echo ""
echo "Après chargement:"
echo "  🔍 ARÊTES CHARGÉES DEPUIS LA BASE: [nombre]"
echo "  🔍 Arêtes marriage_child_connection trouvées: [nombre]"
echo ""
echo "❌ SI marriage_child_connection = 0:"
echo "   → Problème de sauvegarde en base"
echo ""
echo "✅ SI marriage_child_connection > 0:"
echo "   → Problème de rendu/affichage"
echo ""

# Ouvrir automatiquement le navigateur si possible
if command -v open &> /dev/null; then
    echo "🌐 Ouverture automatique du navigateur..."
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    echo "🌐 Ouverture automatique du navigateur..."
    xdg-open http://localhost:5173
fi

echo "🔍 Prêt pour le diagnostic de persistance !"