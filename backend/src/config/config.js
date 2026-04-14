const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

module.exports = {
  // Environnement
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // Base de données
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'logsys_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000
    },
    define: {
      underscored: true,
      timestamps: true,
      paranoid: true
    }
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: 'logsys:'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'logsys-jwt-secret-key-2024-change-in-production',
    accessExpirationMinutes: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES, 10) || 30,
    refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS, 10) || 30,
    resetPasswordExpirationMinutes: parseInt(process.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES, 10) || 10,
    verifyEmailExpirationMinutes: parseInt(process.env.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES, 10) || 60
  },

  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    },
    from: process.env.EMAIL_FROM || 'LogSys CRM <noreply@logsys.com>',
    replyTo: process.env.EMAIL_REPLY_TO || 'support@logsys.com'
  },

  // SMS (Twilio)
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },

  // Stockage fichiers
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    local: {
      uploadDir: path.join(__dirname, '../../uploads'),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 100 * 1024 * 1024 // 100MB
    },
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  },

  // Sécurité
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
    },
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
      credentials: true
    }
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: path.join(__dirname, '../../logs'),
    maxSize: '20m',
    maxFiles: '14d'
  },

  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY
  },

  // API externes
  externalApis: {
    openExchangeRates: {
      apiKey: process.env.OPEN_EXCHANGE_RATES_API_KEY,
      baseUrl: 'https://openexchangerates.org/api'
    },
    googleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY
    }
  },

  // Fonctionnalités
  features: {
    enableOCR: process.env.ENABLE_OCR === 'true',
    enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
    enable2FA: process.env.ENABLE_2FA === 'true',
    enableAuditLog: true,
    enableNotifications: true,
    enableRealTime: true
  },

  // Plan comptable OHADA
  ohada: {
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'XOF',
    fiscalYearStart: process.env.FISCAL_YEAR_START || '01-01',
    fiscalYearEnd: process.env.FISCAL_YEAR_END || '12-31'
  },

  // Plans d'abonnement
  subscriptions: {
    basic: {
      maxUsers: 5,
      price: 0,
      modules: ['MESSAGING', 'MEETING', 'NOTIFICATION']
    },
    pro: {
      maxUsers: 50,
      price: 100,
      modules: ['MESSAGING', 'MEETING', 'NOTIFICATION', 'LOGISTICS', 'DOCUMENT']
    },
    enterprise: {
      maxUsers: 100,
      price: 150,
      modules: ['MESSAGING', 'MEETING', 'NOTIFICATION', 'LOGISTICS', 'ACCOUNTING', 'DOCUMENT', 'AUDIT']
    }
  }
};