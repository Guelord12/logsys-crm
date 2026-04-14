#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="logsys_db"
DB_USER="logsys_user"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Fichier de sauvegarde non trouvé: $BACKUP_FILE"
    exit 1
fi

echo "Restauration de la base de données $DB_NAME depuis $BACKUP_FILE..."

gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U $DB_USER -d $DB_NAME

echo "Restauration terminée."