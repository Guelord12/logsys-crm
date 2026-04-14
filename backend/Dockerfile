FROM node:18-alpine AS builder

WORKDIR /app

# Copier TOUS les fichiers du dossier backend
COPY . .

# Installer les dépendances
RUN npm install

# Stage de production
FROM node:18-alpine

WORKDIR /app

# Installer curl pour healthcheck
RUN apk add --no-cache curl

# Copier depuis le builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/src ./src

# Créer les dossiers nécessaires
RUN mkdir -p /app/uploads /app/logs

# Exposer le port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Démarrer l'application
CMD ["node", "server.js"]