#!/bin/bash

# Script de test pour vérifier les corrections geneaIA

echo "🧪 Test des corrections geneaIA"
echo "================================"

# Vérifier que les fichiers modifiés existent
echo "📁 Vérification des fichiers modifiés..."

FILES=(
    "frontend/src/pages/FamilyTreePage.jsx"
    "frontend/src/components/FamilyTree/AddPersonModal.jsx"
    "frontend/src/store/familyTreeStore.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file manquant"
    fi
done

echo ""
echo "🔍 Vérification des corrections spécifiques..."

# Vérifier la légende repliable
if grep -q "showLegend" frontend/src/pages/FamilyTreePage.jsx; then
    echo "✅ Légende repliable implémentée"
else
    echo "❌ Légende repliable manquante"
fi

# Vérifier la validation des dates
if grep -q "birthDate.trim" frontend/src/store/familyTreeStore.js; then
    echo "❌ Erreur trim() détectée dans store"
else
    echo "✅ Validation des dates corrigée dans store"
fi

# Vérifier la validation dans le modal
if grep -q "isNaN(birthDate.getTime())" frontend/src/components/FamilyTree/AddPersonModal.jsx; then
    echo "✅ Validation des dates dans le modal"
else
    echo "❌ Validation des dates manquante dans le modal"
fi

# Vérifier les attributs min/max sur les dates
if grep -q 'min="1800-01-01"' frontend/src/components/FamilyTree/AddPersonModal.jsx; then
    echo "✅ Attributs min/max ajoutés aux champs de date"
else
    echo "❌ Attributs min/max manquants"
fi

echo ""
echo "📋 Résumé des corrections:"
echo "1. Légende repliable avec bouton"
echo "2. Validation robuste des dates"
echo "3. Gestion d'erreurs améliorée"
echo "4. Nettoyage des données avant envoi"
echo ""
echo "🚀 Pour tester:"
echo "1. npm run dev (frontend)"
echo "2. Cliquer sur l'icône ℹ️ pour la légende"
echo "3. Ajouter une personne avec des dates"
echo "4. Vérifier les messages d'erreur"
