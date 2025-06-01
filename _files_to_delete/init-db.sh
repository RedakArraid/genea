#!/bin/bash

# Script pour réinitialiser la base de données et lancer une migration propre

# Fonction pour gérer les erreurs
error_exit() {
  echo "Error: $1" >&2
  exit 1
}

# Vérifier si le dossier backend existe
if [ ! -d "backend" ]; then
  error_exit "Le dossier 'backend' n'existe pas. Exécutez ce script depuis le répertoire racine du projet."
fi

# Se déplacer dans le dossier backend
cd backend || error_exit "Impossible d'accéder au dossier backend"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
  error_exit "Node.js n'est pas installé. Veuillez installer Node.js."
fi

# Vérifier si Prisma est installé
if ! command -v npx prisma &> /dev/null; then
  echo "Installation de Prisma CLI..."
  npm install -g prisma || error_exit "Impossible d'installer Prisma CLI"
fi

# Vérifier si le fichier .env existe avec la variable DATABASE_URL
if [ ! -f ".env" ]; then
  error_exit "Le fichier .env n'existe pas. Veuillez le créer avec la variable DATABASE_URL."
fi

# Installer les dépendances si node_modules n'existe pas
if [ ! -d "node_modules" ]; then
  echo "Installation des dépendances..."
  npm install || error_exit "Impossible d'installer les dépendances"
fi

# Réinitialiser la base de données (supprime toutes les tables et recrée la base de données)
echo "Réinitialisation de la base de données..."
npx prisma migrate reset --force || error_exit "Échec de la réinitialisation de la base de données"

# Créer une nouvelle migration
echo "Création d'une nouvelle migration..."
npx prisma migrate dev --name init || error_exit "Échec de la création de la migration"

# Générer le client Prisma
echo "Génération du client Prisma..."
npx prisma generate || error_exit "Échec de la génération du client Prisma"

# Seed de la base de données
echo "Ajout des données initiales..."
npx prisma db seed || error_exit "Échec du seed de la base de données"

echo "Base de données initialisée avec succès !"
echo "Vous pouvez maintenant lancer l'application avec la commande './start.sh'"

cd ..