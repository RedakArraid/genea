#!/bin/bash

# 🔑 Script de génération des clés SSH pour le déploiement

echo "🔐 Génération des clés SSH pour le déploiement GeneaIA"

# Créer le dossier ssh s'il n'existe pas
mkdir -p ~/.ssh

# Générer la clé SSH spécifique pour le déploiement
echo "📝 Génération de la clé SSH..."
ssh-keygen -t ed25519 -f ~/.ssh/geneaia_deploy -C "deploy@geneaia-$(date +%Y%m%d)" -N ""

echo "✅ Clé SSH générée avec succès !"
echo ""
echo "📋 INFORMATIONS IMPORTANTES :"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 CLÉ PRIVÉE (à ajouter dans GitHub Secrets) :"
echo "   Nom du secret : PROD_SSH_KEY ou STAGING_SSH_KEY"
echo "   Contenu :"
echo ""
cat ~/.ssh/geneaia_deploy
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔓 CLÉ PUBLIQUE (à ajouter sur votre VPS) :"
echo "   Commande à exécuter sur votre VPS :"
echo ""
echo "   echo '$(cat ~/.ssh/geneaia_deploy.pub)' >> ~/.ssh/authorized_keys"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 PROCHAINES ÉTAPES :"
echo "1. Copiez la clé privée (ci-dessus) dans GitHub Secrets"
echo "2. Connectez-vous à votre VPS et ajoutez la clé publique"
echo "3. Testez la connexion SSH"
echo ""

# Sauvegarder les clés dans un fichier pour référence
echo "💾 Sauvegarde des informations dans deploy_keys_info.txt"
{
    echo "=== INFORMATIONS DE DÉPLOIEMENT GENEAIA ==="
    echo "Date de génération: $(date)"
    echo ""
    echo "=== CLÉ PRIVÉE (GitHub Secret) ==="
    cat ~/.ssh/geneaia_deploy
    echo ""
    echo "=== CLÉ PUBLIQUE (VPS authorized_keys) ==="
    cat ~/.ssh/geneaia_deploy.pub
    echo ""
    echo "=== COMMANDES POUR LE VPS ==="
    echo "echo '$(cat ~/.ssh/geneaia_deploy.pub)' >> ~/.ssh/authorized_keys"
    echo "chmod 600 ~/.ssh/authorized_keys"
    echo "chmod 700 ~/.ssh"
} > deploy_keys_info.txt

echo "📄 Informations sauvegardées dans : deploy_keys_info.txt"
echo ""
echo "⚠️  SÉCURITÉ : Supprimez ce fichier après configuration !"
