const rateLimit = require('express-rate-limit');

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Trop de requêtes, veuillez réessayer plus tard',
    keyGenerator = (req) => req.user?.id || req.ip
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Limiteurs spécifiques
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes'
});

const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 200,
  message: 'Limite de requêtes atteinte'
});

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Limite d\'upload atteinte'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter
};