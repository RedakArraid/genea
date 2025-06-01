#!/bin/bash

echo "🧪 Test de l'API Backend"
echo "======================="

BACKEND_URL="http://168.231.86.179:3001"

echo "1. 📡 Test de connectivité au backend..."
if curl -s --connect-timeout 5 "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    echo "✅ Backend accessible"
else
    echo "❌ Backend non accessible sur $BACKEND_URL"
    echo "   Vérifiez que le backend est démarré"
    exit 1
fi

echo ""
echo "2. 🔍 Informations du serveur:"
curl -s "$BACKEND_URL/api/health" 2>/dev/null || echo "Endpoint /api/health non disponible"

echo ""
echo "3. 📝 Pour tester manuellement l'API de mise à jour:"
echo "   Utilisez l'interface web ou Postman avec:"
echo "   PUT $BACKEND_URL/api/persons/{id}"
echo "   Body: {"
echo "     \"firstName\": \"Test\","
echo "     \"lastName\": \"User\","
echo "     \"birthDate\": \"1990-01-01\""
echo "   }"

echo ""
echo "4. 🚨 Si l'erreur persiste:"
echo "   L'ancien code est encore en mémoire"
echo "   REDÉMARREZ LE BACKEND OBLIGATOIREMENT !"
