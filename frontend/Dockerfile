# Dockerfile simplifié pour le frontend
FROM node:18-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ARG VITE_API_URL=http://168.231.86.179:8080/api
ENV VITE_API_URL=$VITE_API_URL

# Build de l'application
RUN npm run build

# Phase de production avec Nginx
FROM nginx:alpine

# Copier les configurations Nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.default.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=build /app/dist /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Health check simple
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
