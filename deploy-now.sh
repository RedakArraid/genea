#!/bin/bash
cd /Users/kader/Desktop/projet-en-cours/geneaIA
chmod +x scripts/deploy-full.sh
echo "🌙 Déploiement mode nuit..."
./scripts/deploy-full.sh staging "🌙 Dark mode toggle"
echo "✅ Mode nuit déployé en staging !"
echo "🔗 Vérifiez GitHub Actions pour le suivi"