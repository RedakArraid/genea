# Backend Dockerfile optimisé pour la production
FROM node:18-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Phase de construction
FROM base AS dependencies

# Installer toutes les dépendances (dev + prod)
RUN npm ci --only=production && npm cache clean --force

# Générer le client Prisma
RUN npx prisma generate

# Phase de développement
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Phase de production
FROM base AS production

# Copier les dépendances de production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/node_modules/.prisma ./node_modules/.prisma

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Créer les dossiers nécessaires
RUN mkdir -p /app/uploads /app/logs
RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["npm", "start"]
