#!/bin/bash
echo "🔑 Génération d'une clé SSH dédiée pour les déploiements..."

# Générer une nouvelle clé SSH
ssh-keygen -t ed25519 -C "geneaia-deploy-$(date +%Y%m%d)" -f ~/.ssh/geneaia-deploy -N ""

echo "✅ Clé SSH générée:"
echo "📁 Clé privée: ~/.ssh/geneaia-deploy"
echo "📁 Clé publique: ~/.ssh/geneaia-deploy.pub"

echo ""
echo "🔐 Contenu de la clé privée (à copier dans GitHub Secrets):"
echo "=========================================================="
cat ~/.ssh/geneaia-deploy

echo ""
echo "📋 Prochaines étapes:"
echo "1. Copier la clé privée ci-dessus dans GitHub Secrets (STAGING_SSH_KEY et PROD_SSH_KEY)"
echo "2. Ajouter la clé publique sur le serveur:"
echo "   ssh-copy-id -i ~/.ssh/geneaia-deploy.pub root@168.231.86.179"
echo "3. Tester la connexion:"
echo "   ssh -i ~/.ssh/geneaia-deploy root@168.231.86.179"
