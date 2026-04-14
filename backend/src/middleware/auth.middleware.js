const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const db = require('../models');
const config = require('../config/config');
const logger = require('../utils/logger');

const { User, UserSession } = db;

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const session = await UserSession.findOne({
      where: {
        sessionToken: token,
        isActive: true,
        userId: decoded.id,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session invalide ou expirée'
      });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: {
        exclude: ['passwordHash', 'passwordResetToken', 'twoFactorSecret']
      },
      include: [{
        model: db.Company,
        as: 'company'
      }]
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur inactif ou supprimé'
      });
    }

    await user.update({ lastActivityAt: new Date() });
    await session.update({ lastActivityAt: new Date() });

    req.user = user;
    req.session = session;
    req.token = token;

    next();

  } catch (error) {
    logger.error('Erreur d\'authentification:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expiré' });
    }
    
    next(error);
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentification requise' });
    }

    const hasRole = allowedRoles.some(role => {
      switch (role) {
        case 'SYSTEM_ADMIN':
          return req.user.isSystemAdmin;
        case 'COMPANY_ADMIN':
          return req.user.isCompanyAdmin;
        case 'USER':
          return true;
        default:
          return false;
      }
    });

    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    next();
  };
};

const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token requis' });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.secret);

    const session = await UserSession.findOne({
      where: {
        refreshToken,
        isActive: true,
        userId: decoded.id
      }
    });

    if (!session) {
      return res.status(401).json({ success: false, message: 'Refresh token invalide' });
    }

    req.refreshTokenData = decoded;
    req.userSession = session;
    next();

  } catch (error) {
    logger.error('Erreur de validation du refresh token:', error);
    return res.status(401).json({ success: false, message: 'Refresh token invalide ou expiré' });
  }
};

module.exports = {
  authenticate,
  authorize,
  validateRefreshToken
};