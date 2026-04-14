Write-Host "🚀 Démarrage de LogSys CRM..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Vérifier Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker n'est pas installé" -ForegroundColor Red
    exit 1
}

# Vérifier Docker Compose
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose n'est pas installé" -ForegroundColor Red
    exit 1
}

# Copier les fichiers .env s'ils n'existent pas
if (!(Test-Path "backend\.env")) {
    Write-Host "📝 Création du fichier .env backend..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
}

if (!(Test-Path "frontend\.env")) {
    Write-Host "📝 Création du fichier .env frontend..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
}

# Démarrer les services
Write-Host "🐳 Démarrage des conteneurs Docker..." -ForegroundColor Green
docker-compose up -d

# Attendre que les services soient prêts
Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Vérifier l'état
Write-Host "📊 État des services :" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "✅ LogSys CRM est démarré !" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "🔌 API: http://localhost:5000" -ForegroundColor White
Write-Host "📚 Documentation API: http://localhost:5000/api-docs" -ForegroundColor White
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "👤 Identifiants par défaut :" -ForegroundColor Yellow
Write-Host "   Admin Système: admin@logsys.com / Admin@2024" -ForegroundColor White
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "From G-tech" -ForegroundColor Blue