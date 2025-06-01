# Multi-stage build pour le frontend
FROM node:18-alpine AS base

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Phase de construction
FROM base AS build

# Arguments de build
ARG VITE_API_URL
ARG NODE_ENV=production

# Variables d'environnement
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_ENV=$NODE_ENV

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Phase de production avec Nginx
FROM nginx:alpine AS production

# Copier la configuration Nginx optimisée
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.default.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=build /app/dist /usr/share/nginx/html

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginx -u 1001 -G nginx

# Ajuster les permissions
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chown -R nginx:nginx /var/cache/nginx
RUN chown -R nginx:nginx /var/log/nginx
RUN chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
