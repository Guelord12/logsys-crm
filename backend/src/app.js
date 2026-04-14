const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const config = require('./config/config');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
require('./config/passport');

const app = express();

// Sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:']
    }
  }
}));

// CORS
app.use(cors({
  origin: config.security.cors.origin,
  credentials: true
}));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session
const pgPool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name
});

app.use(session({
  store: new pgSession({
    pool: pgPool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'logsys-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/companies', require('./routes/company.routes'));
app.use('/api/v1/subscriptions', require('./routes/subscription.routes'));
app.use('/api/v1/messages', require('./routes/message.routes'));
app.use('/api/v1/meetings', require('./routes/meeting.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));
app.use('/api/v1/logistics', require('./routes/logistic.routes'));
app.use('/api/v1/accounting', require('./routes/accounting.routes'));
app.use('/api/v1/documents', require('./routes/document.routes'));
app.use('/api/v1/audit', require('./routes/audit.routes'));
app.use('/api/v1/dashboard', require('./routes/dashboard.routes'));
app.use('/api/v1/settings', require('./routes/setting.routes'));
app.use('/api/v1/reports', require('./routes/report.routes'));
app.use('/api/v1/tasks', require('./routes/task.routes'));

// Santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Erreurs
app.use(notFound);
app.use(errorHandler);

module.exports = app;