#!/bin/bash

BACKUP_DIR="/var/backups/logsys"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="logsys_db"
DB_USER="logsys_user"

mkdir -p $BACKUP_DIR

echo "Sauvegarde de la base de données $DB_NAME..."

docker-compose exec -T postgres pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

echo "Sauvegarde terminée: $BACKUP_DIR/backup_$DATE.sql.gz"

find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Nettoyage des anciennes sauvegardes terminé."