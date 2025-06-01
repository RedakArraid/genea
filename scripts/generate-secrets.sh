#!/bin/bash

# Script de génération des secrets et clés pour GeneaIA
echo "🔐 Génération des secrets pour GeneaIA"
echo "====================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔑 Génération des clés SSH...${NC}"

# Créer le dossier .ssh s'il n'existe pas
mkdir -p ~/.ssh

# Générer les clés SSH si elles n'existent pas
if [[ ! -f ~/.ssh/geneaia_deploy ]]; then
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/geneaia_deploy -N "" -C "geneaia-deploy-$(date +%Y%m%d)"
    echo -e "${GREEN}✅ Clés SSH générées${NC}"
else
    echo -e "${YELLOW}⚠️  Clés SSH existantes trouvées${NC}"
fi

echo ""
echo -e "${BLUE}🔐 Génération des secrets...${NC}"

# Génération des secrets
JWT_SECRET_PROD=$(openssl rand -base64 32)
JWT_SECRET_STAGING=$(openssl rand -base64 32)
DB_PASSWORD_PROD=$(openssl rand -base64 24)
DB_PASSWORD_STAGING=$(openssl rand -base64 24)

echo ""
echo "=========================================="
echo "🔑 CLÉ PUBLIQUE SSH (à ajouter sur le VPS)"
echo "=========================================="
cat ~/.ssh/geneaia_deploy.pub
echo ""

echo "=========================================="
echo "🔐 SECRETS GITHUB ENVIRONMENTS"
echo "=========================================="
echo ""
echo -e "${GREEN}📋 Environment: production${NC}"
echo "PROD_SSH_KEY:"
cat ~/.ssh/geneaia_deploy
echo ""
echo "PROD_JWT_SECRET: $JWT_SECRET_PROD"
echo "PROD_DB_PASSWORD: $DB_PASSWORD_PROD"
echo ""

echo -e "${GREEN}📋 Environment: staging${NC}"
echo "STAGING_SSH_KEY:"
cat ~/.ssh/geneaia_deploy
echo ""
echo "STAGING_JWT_SECRET: $JWT_SECRET_STAGING"
echo "STAGING_DB_PASSWORD: $DB_PASSWORD_STAGING"
echo ""

echo "=========================================="
echo "📝 INSTRUCTIONS"
echo "=========================================="
echo "1. Copiez la clé publique SSH ci-dessus"
echo "2. Ajoutez-la sur votre VPS dans ~/.ssh/authorized_keys"
echo "3. Copiez les secrets dans GitHub > Settings > Environments"
echo "4. Complétez avec vos informations serveur (IP, paths, etc.)"
echo ""
echo -e "${GREEN}✅ Secrets générés avec succès!${NC}"