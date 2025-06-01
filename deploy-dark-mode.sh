#!/bin/bash

echo "🌙 Déploiement Mode Nuit GeneaIA"
echo "================================"

# Aller dans le bon dossier
cd /Users/kader/Desktop/projet-en-cours/geneaIA

# Rendre les scripts exécutables
chmod +x scripts/deploy-full.sh

echo "✅ Scripts préparés"

# Menu simple
echo ""
echo "Choisissez votre action :"
echo "1) Test local"
echo "2) Déployer staging"
echo "3) Déployer production"
echo "4) Test + Staging + Production (tout faire)"

read -p "Votre choix (1-4): " choice

case $choice in
    1)
        echo "🧪 Lancement du test local..."
        npm run dev
        ;;
    2)
        echo "🎭 Déploiement staging..."
        ./scripts/deploy-full.sh staging "🌙 Dark mode toggle"
        ;;
    3)
        echo "🚀 Déploiement production..."
        ./scripts/deploy-full.sh production "🚀 Dark mode live"
        ;;
    4)
        echo "🎯 Déploiement complet..."
        echo "1️⃣ Test local pendant 10 secondes..."
        timeout 10 npm run dev || echo "Test terminé"
        echo "2️⃣ Déploiement staging..."
        ./scripts/deploy-full.sh staging "🌙 Dark mode toggle"
        read -p "Staging OK ? Continuer vers production ? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            echo "3️⃣ Déploiement production..."
            ./scripts/deploy-full.sh production "🚀 Dark mode live"
        fi
        ;;
    *)
        echo "❌ Choix invalide"
        ;;
esac

echo "🎉 Terminé !"