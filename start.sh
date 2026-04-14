#!/bin/bash

echo "🚀 Démarrage de LogSys CRM..."
echo "=================================="

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Copier les fichiers .env s'ils n'existent pas
if [ ! -f backend/.env ]; then
    echo "📝 Création du fichier .env backend..."
    cp backend/.env.example backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Création du fichier .env frontend..."
    cp frontend/.env.example frontend/.env
fi

# Démarrer les services
echo "🐳 Démarrage des conteneurs Docker..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier l'état
echo "📊 État des services :"
docker-compose ps

echo ""
echo "✅ LogSys CRM est démarré !"
echo "=================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:5000"
echo "📚 Documentation API: http://localhost:5000/api-docs"
echo "=================================="
echo "👤 Identifiants par défaut :"
echo "   Admin Système: admin@logsys.com / Admin@2024"
echo "=================================="
echo "From G-tech"