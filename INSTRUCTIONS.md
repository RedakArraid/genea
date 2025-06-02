# 🚀 Instructions de configuration CI/CD GeneaIA

## 📋 Étapes à suivre

### 1. 🔑 Configurer SSH
```bash
# Générer la clé SSH dédiée
./generate-ssh-key.sh

# Copier la clé publique sur le serveur
ssh-copy-id -i ~/.ssh/geneaia-deploy.pub root@168.231.86.179

# Tester la connexion
ssh -i ~/.ssh/geneaia-deploy root@168.231.86.179
```

### 2. 🔐 Configurer GitHub Secrets
1. Aller sur GitHub → Settings → Secrets and variables → Actions
2. Copier tous les secrets depuis `secrets-github.txt`
3. Remplacer `<VOTRE_CLÉ_SSH_PRIVÉE_COMPLÈTE>` par le contenu de `~/.ssh/geneaia-deploy`

### 3. 🚀 Tester le déploiement
```bash
# Pousser sur staging
git checkout staging
git add .
git commit -m "🔧 Setup: new optimized CI/CD"
git push origin staging

# Vérifier le résultat
curl http://168.231.86.179:3010  # Frontend staging
curl http://168.231.86.179:3011/api/health  # Backend staging
```

### 4. 🎯 Déployer en production
```bash
# Merger vers main pour déployer en production
git checkout main
git merge staging
git push origin main

# Vérifier la production
curl http://168.231.86.179:8080  # App production complète
```

## 🔍 URLs de test

| Environnement | URL | Description |
|---------------|-----|-------------|
| **Staging Frontend** | http://168.231.86.179:3010 | Interface de test |
| **Staging Backend** | http://168.231.86.179:3011/api | API de test |
| **Production** | http://168.231.86.179:8080 | Application live |

## 🆘 Dépannage

### Erreur SSH
```bash
# Vérifier la clé
ssh -i ~/.ssh/geneaia-deploy root@168.231.86.179

# Permissions correctes
chmod 600 ~/.ssh/geneaia-deploy
chmod 644 ~/.ssh/geneaia-deploy.pub
```

### Erreur de déploiement
```bash
# Sur le serveur, voir les logs
ssh root@168.231.86.179
cd /var/www/geneaia-staging
docker-compose logs
```

### Reset complet
```bash
# Sur le serveur, reset complet
docker-compose down
docker volume rm geneaia-staging_postgres_staging_data
docker-compose up -d
```
