#!/bin/bash

set -e

echo "🚀 Déploiement de LogSys CRM en production..."
echo "================================================"

# Variables
DEPLOY_DIR="/var/www/logsys"
BACKUP_DIR="/var/backups/logsys"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer les dossiers
mkdir -p $DEPLOY_DIR $BACKUP_DIR

# Backup de la base de données
echo "📦 Sauvegarde de la base de données..."
docker-compose exec -T postgres pg_dump -U logsys_user logsys_db > $BACKUP_DIR/backup_$DATE.sql

# Pull des dernières modifications
echo "📥 Récupération du code..."
cd $DEPLOY_DIR
git pull origin main

# Installation des dépendances backend
echo "📦 Installation des dépendances backend..."
cd backend
yarn install --frozen-lockfile --production

# Installation des dépendances frontend et build
echo "🏗️ Build du frontend..."
cd ../frontend
yarn install --frozen-lockfile
yarn build

# Redémarrage des services
echo "🔄 Redémarrage des services..."
cd ..
docker-compose down
docker-compose up -d --build

# Nettoyage
echo "🧹 Nettoyage..."
docker system prune -f

# Vérification
echo "✅ Vérification des services..."
sleep 10
curl -f http://localhost:5000/health || echo "⚠️ Backend non accessible"
curl -f http://localhost:3000 || echo "⚠️ Frontend non accessible"

echo ""
echo "✅ Déploiement terminé avec succès !"
echo "================================================"
echo "🌐 Application: https://logsys.g-tech.com"
echo "📊 Monitoring: https://logsys.g-tech.com/health"
echo "================================================"