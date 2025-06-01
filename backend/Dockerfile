# Backend Dockerfile optimisé pour la production - CORRIGÉ
FROM node:18-slim AS base

# Installer les dépendances système nécessaires pour Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Phase de construction
FROM base AS dependencies

# Installer toutes les dépendances
RUN npm ci && npm cache clean --force

# Générer le client Prisma
RUN npx prisma generate

# Phase de production
FROM base AS production

# Copier les dépendances
COPY --from=dependencies /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p /app/uploads /app/logs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["npm", "start"]
