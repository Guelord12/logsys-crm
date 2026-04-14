const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Importer la configuration
const config = require('./src/config/config');
const logger = require('./src/utils/logger');
const { sequelize } = require('./src/models');

// Initialiser Express
const app = express();
const server = http.createServer(app);

// Importer Socket.IO (avec gestion d'erreur)
let io = null;
try {
  const socketIO = require('socket.io');
  const socketModule = require('./src/websocket/socket');
  
  io = socketIO(server, {
    cors: {
      origin: config.security?.cors?.origin || ['http://localhost:3000'],
      credentials: true
    }
  });
  
  if (socketModule.initializeSocket) {
    socketModule.initializeSocket(io);
    logger.info('✅ Socket.IO initialisé');
  }
} catch (error) {
  logger.warn('⚠️ Socket.IO non initialisé:', error.message);
}

// =====================================================
// MIDDLEWARES GLOBAUX
// =====================================================

// Importer les middlewares personnalisés
const { authenticate } = require('./src/middleware/auth.middleware');
const { requirePasswordChangeIfNeeded } = require('./src/middleware/passwordChange.middleware');
const { requireModuleAccess } = require('./src/services/moduleAccess.service');

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: false
}));

// Configuration CORS
app.use(cors({
  origin: config.security?.cors?.origin || ['http://localhost:3000'],
  credentials: true
}));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================================================
// FONCTIONS HELPERS POUR LES ROUTES
// =====================================================

// Fonction helper pour charger une route en toute sécurité
const safeRequire = (modulePath) => {
  try {
    return require(modulePath);
  } catch (error) {
    logger.warn(`⚠️ Module non trouvé: ${modulePath}`);
    return null;
  }
};

// Fonction helper pour charger et appliquer une route
const loadRoute = (routePath, routeFile) => {
  const route = safeRequire(routeFile);
  if (route) {
    app.use(routePath, route);
    logger.info(`✅ Route chargée: ${routePath}`);
  } else {
    logger.warn(`⚠️ Route non chargée: ${routePath}`);
  }
};

// =====================================================
// ROUTES PUBLIQUES (SANS AUTHENTIFICATION)
// =====================================================

// Authentification (login, register, forgot-password, etc.)
loadRoute('/api/v1/auth', './src/routes/auth.routes');

// Références (pays, secteurs, postes) - ROUTES PUBLIQUES
loadRoute('/api/v1/reference', './src/routes/reference.routes');

// ✅ AJOUT : Webhooks pour services externes (SendGrid, etc.)
// Cette route doit être AVANT le middleware d'authentification
app.use('/api/v1/webhooks', require('./src/routes/webhook.routes'));

// Route de santé (publique)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: 'Connected',
    redis: config.redis?.host ? 'Connected' : 'Disabled'
  });
});

// Route racine (publique)
app.get('/', (req, res) => {
  res.json({
    name: 'LogSys CRM API',
    version: '1.0.0',
    status: 'Operational',
    footer: 'From G-tech',
    endpoints: {
      auth: '/api/v1/auth',
      reference: '/api/v1/reference',
      users: '/api/v1/users',
      companies: '/api/v1/companies',
      subscriptions: '/api/v1/subscriptions',
      dashboard: '/api/v1/dashboard',
      messages: '/api/v1/messages',
      meetings: '/api/v1/meetings',
      notifications: '/api/v1/notifications',
      logistics: '/api/v1/logistics',
      accounting: '/api/v1/accounting',
      documents: '/api/v1/documents',
      audit: '/api/v1/audit',
      tasks: '/api/v1/tasks',
      settings: '/api/v1/settings',
      reports: '/api/v1/reports',
      departments: '/api/v1/departments',
      positionTasks: '/api/v1/position-tasks',
      workflows: '/api/v1/workflows',
      kpis: '/api/v1/kpis'
    }
  });
});

// =====================================================
// MIDDLEWARE D'AUTHENTIFICATION GLOBAL
// =====================================================

// Toutes les routes ci-dessous nécessitent une authentification
app.use('/api/v1', authenticate);

// =====================================================
// MIDDLEWARE DE VÉRIFICATION DU CHANGEMENT DE MOT DE PASSE
// =====================================================

// Vérifier si le mot de passe doit être changé (sauf pour la route change-password)
app.use('/api/v1', (req, res, next) => {
  // Exclure les routes d'authentification et de référence
  if (req.path === '/auth/change-password' || 
      req.path === '/auth/logout' || 
      req.path === '/auth/me' ||
      req.path.startsWith('/reference')) {
    return next();
  }
  return requirePasswordChangeIfNeeded(req, res, next);
});

// =====================================================
// ROUTES PROTÉGÉES (AVEC AUTHENTIFICATION)
// =====================================================

// Utilisateurs
loadRoute('/api/v1/users', './src/routes/user.routes');

// Entreprises
loadRoute('/api/v1/companies', './src/routes/company.routes');

// Abonnements
loadRoute('/api/v1/subscriptions', './src/routes/subscription.routes');

// Tableau de bord
loadRoute('/api/v1/dashboard', './src/routes/dashboard.routes');

// Messagerie
loadRoute('/api/v1/messages', './src/routes/message.routes.js');

// Réunions
loadRoute('/api/v1/meetings', './src/routes/meeting.routes');

// Notifications
loadRoute('/api/v1/notifications', './src/routes/notification.routes');

// Documents
loadRoute('/api/v1/documents', './src/routes/document.routes');

// Audit
loadRoute('/api/v1/audit', './src/routes/audit.routes');

// Tâches
loadRoute('/api/v1/tasks', './src/routes/task.routes');

// Paramètres
loadRoute('/api/v1/settings', './src/routes/setting.routes');

// Rapports
loadRoute('/api/v1/reports', './src/routes/report.routes');

// =====================================================
// ROUTES DES MODULES (AVEC VÉRIFICATION D'ACCÈS)
// =====================================================

// Module Logistique (nécessite accès 'logistics')
app.use('/api/v1/logistics', 
  requireModuleAccess('logistics', 'READ'),
  safeRequire('./src/routes/logistic.routes') || ((req, res) => res.status(500).json({ message: 'Route non disponible' }))
);

// Module Comptabilité (nécessite accès 'accounting')
app.use('/api/v1/accounting', 
  requireModuleAccess('accounting', 'READ'),
  safeRequire('./src/routes/accounting.routes') || ((req, res) => res.status(500).json({ message: 'Route non disponible' }))
);

// =====================================================
// NOUVELLES ROUTES - ORGANIGRAMME ET DÉPARTEMENTS
// =====================================================

// Départements et organigramme
loadRoute('/api/v1/departments', './src/routes/department.routes');

// =====================================================
// NOUVELLES ROUTES - TÂCHES AUTOMATIQUES PAR POSTE
// =====================================================

// Tâches de poste (position tasks)
loadRoute('/api/v1/position-tasks', './src/routes/positionTask.routes');

// =====================================================
// NOUVELLES ROUTES - WORKFLOWS AUTOMATIQUES
// =====================================================

// Workflows
loadRoute('/api/v1/workflows', './src/routes/workflow.routes');

// =====================================================
// NOUVELLES ROUTES - KPIs ET INDICATEURS DE PERFORMANCE
// =====================================================

// KPIs
loadRoute('/api/v1/kpis', './src/routes/kpi.routes');

// =====================================================
// GESTION DES ERREURS
// =====================================================

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  logger.error('Erreur serveur:', err.message);
  
  // Erreurs Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: err.errors.map(e => e.message).join(', ')
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Cette ressource existe déjà'
    });
  }
  
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Référence invalide'
    });
  }
  
  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré'
    });
  }
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =====================================================
// DÉMARRAGE DU SERVEUR
// =====================================================

const PORT = config.port || 5000;

const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    logger.info('✅ Connexion à PostgreSQL établie');

    server.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 LogSys CRM Server démarré sur le port ${PORT}        ║
║   🌍 Environnement: ${process.env.NODE_ENV || 'development'}                 ║
║   📅 Démarré le: ${new Date().toLocaleString()}                ║
║                                                          ║
║   From G-tech                                             ║
╚══════════════════════════════════════════════════════════╝
      `);
    });

  } catch (error) {
    logger.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
};

// Gestion des signaux de terminaison
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} reçu. Arrêt gracieux...`);
  
  server.close(async () => {
    logger.info('Serveur HTTP arrêté');
    
    try {
      await sequelize.close();
      logger.info('Connexion base de données fermée');
      
      process.exit(0);
    } catch (error) {
      logger.error('Erreur lors de l\'arrêt:', error);
      process.exit(1);
    }
  });
  
  setTimeout(() => {
    logger.error('Arrêt forcé après timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Exception non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée non gérée:', reason);
  process.exit(1);
});

startServer();

module.exports = { app, server, io };