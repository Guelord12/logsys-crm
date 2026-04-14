// backend/src/middleware/passwordChange.middleware.js

const { Op } = require('sequelize');
const db = require('../models');

/**
 * Middleware pour vérifier si le changement de mot de passe est obligatoire
 */
async function requirePasswordChangeIfNeeded(req, res, next) {
  try {
    const user = req.user;
    
    if (!user) {
      return next();
    }
    
    // Vérifier si le mot de passe doit être changé
    const requiresChange = user.isTemporaryPassword || 
      user.forcePasswordChange ||
      (user.passwordChangedAt && 
       new Date() - user.passwordChangedAt > 90 * 24 * 60 * 60 * 1000);
    
    // Routes autorisées sans changement de mot de passe
    const allowedRoutes = [
      '/api/v1/auth/change-password',
      '/api/v1/auth/logout',
      '/api/v1/auth/me'
    ];
    
    const isAllowedRoute = allowedRoutes.some(route => 
      req.originalUrl.startsWith(route)
    );
    
    if (requiresChange && !isAllowedRoute) {
      return res.status(403).json({
        success: false,
        message: 'Changement de mot de passe obligatoire',
        requiresPasswordChange: true,
        reason: user.isTemporaryPassword ? 'temporary_password' : 
                user.forcePasswordChange ? 'forced' : 'expired'
      });
    }
    
    next();
    
  } catch (error) {
    next(error);
  }
}

module.exports = { requirePasswordChangeIfNeeded };