const winston = require('winston');
const path = require('path');
const config = require('../config/config');

// Format personnalisé
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta);
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// Format console (coloré)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0 && meta.stack !== undefined) {
      metaStr = '';
    } else if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta);
    }
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

// Créer le logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  defaultMeta: { service: 'logsys-api' },
  transports: [
    // Fichier pour toutes les erreurs
    new winston.transports.File({
      filename: path.join(config.logging.directory, 'error.log'),
      level: 'error',
      maxsize: 20971520, // 20MB
      maxFiles: 14
    }),
    
    // Fichier pour tous les logs
    new winston.transports.File({
      filename: path.join(config.logging.directory, 'combined.log'),
      maxsize: 20971520,
      maxFiles: 14
    })
  ]
});

// Ajouter la console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Stream pour Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Méthodes helper
logger.logRequest = (req, res, responseTime) => {
  logger.info({
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
};

logger.logError = (error, req = null) => {
  const logData = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    name: error.name
  };
  
  if (req) {
    logData.method = req.method;
    logData.url = req.originalUrl;
    logData.ip = req.ip;
    logData.userId = req.user?.id;
  }
  
  logger.error(logData);
};

logger.logAudit = (action, userId, details = {}) => {
  logger.info({
    type: 'AUDIT',
    action,
    userId,
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;