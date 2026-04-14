const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const config = require('../config/config');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/email.service');
const { sendSMS } = require('../services/sms.service');
const { createNotification } = require('../services/notification.service');
const { generateTemporaryPassword } = require('../utils/helpers');
const { validateEmail, validatePassword } = require('../utils/validators');

const { User, UserSession, LoginHistory, Company, UserType, AuditLog, Role, Permission, UserRole } = db;

/**
 * Inscription/Création de compte (réservé aux administrateurs)
 */
exports.register = async (req, res, next) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phoneNumber,
      phoneCountryCode,
      companyId,
      userTypeId,
      jobPositionId,
      isCompanyAdmin = false,
      roles = []
    } = req.body;

    // Validation
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Vérifier la limite d'utilisateurs si création pour une entreprise
    if (companyId && !req.user?.isSystemAdmin) {
      const company = await Company.findByPk(companyId, {
        include: ['activeSubscription']
      });

      if (company?.activeSubscription) {
        const currentUsers = await User.count({
          where: { companyId, status: 'ACTIVE' }
        });

        if (currentUsers >= company.activeSubscription.userCount) {
          return res.status(400).json({
            success: false,
            message: 'Limite d\'utilisateurs atteinte pour cet abonnement'
          });
        }
      }
    }

    // Générer un mot de passe temporaire
    const temporaryPassword = generateTemporaryPassword();
    
    // Créer l'utilisateur
    const user = await User.create({
      email,
      firstName,
      lastName,
      phoneNumber,
      phoneCountryCode,
      companyId: companyId || req.user?.companyId,
      userTypeId,
      jobPositionId,
      isCompanyAdmin,
      passwordHash: temporaryPassword,
      isTemporaryPassword: true,
      status: 'PENDING_ACTIVATION',
      createdBy: req.user?.id
    });

    // Générer le code utilisateur
    await user.update({
      userCode: `USR${user.id.slice(0, 8).toUpperCase()}`
    });

    // Assigner les rôles si fournis
    if (roles.length > 0) {
      await UserRole.bulkCreate(
        roles.map(roleId => ({
          userId: user.id,
          roleId,
          assignedBy: req.user?.id
        }))
      );
    }

    // Envoyer les identifiants par email
    await sendEmail({
      to: user.email,
      subject: 'Bienvenue sur LogSys CRM - Vos identifiants de connexion',
      template: 'welcome-user',
      data: {
        fullName: user.fullName,
        email: user.email,
        temporaryPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        companyName: user.company?.name
      }
    });

    // Envoyer par SMS si numéro fourni
    if (phoneNumber && phoneCountryCode) {
      await sendSMS({
        to: `${phoneCountryCode}${phoneNumber}`,
        message: `LogSys: Votre compte a été créé. Email: ${email} | Mot de passe temporaire: ${temporaryPassword}`
      });
    }

    // Créer une notification
    await createNotification({
      userId: user.id,
      type: 'NEW_USER_CREATED',
      title: 'Compte créé avec succès',
      message: 'Votre compte LogSys a été créé. Veuillez vous connecter et changer votre mot de passe.',
      priority: 'HIGH'
    });

    // Audit log
    await AuditLog.create({
      userId: req.user?.id,
      companyId: user.companyId,
      actionType: 'CREATE',
      entityType: 'USER',
      entityId: user.id,
      entityName: user.fullName,
      actionDescription: `Création de l'utilisateur ${user.email}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        id: user.id,
        email: user.email,
        userCode: user.userCode,
        temporaryPassword: process.env.NODE_ENV === 'development' ? temporaryPassword : undefined
      }
    });

  } catch (error) {
    logger.error('Erreur lors de l\'inscription:', error);
    next(error);
  }
};

/**
 * Connexion
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({
      where: {
        email,
        status: {
          [Op.in]: ['ACTIVE', 'PENDING_ACTIVATION']
        }
      },
      include: [
        {
          model: Company,
          as: 'company'
        }
      ]
    });

    if (!user) {
      // Enregistrer la tentative échouée
      await LoginHistory.create({
        email,
        loginStatus: 'FAILED',
        failureReason: 'Utilisateur non trouvé',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le compte est verrouillé
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await LoginHistory.create({
        userId: user.id,
        email: user.email,
        loginStatus: 'LOCKED',
        failureReason: 'Compte verrouillé',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(423).json({
        success: false,
        message: 'Compte temporairement verrouillé. Veuillez réessayer plus tard.'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Incrémenter les tentatives échouées
      user.failedLoginAttempts += 1;
      
      // Verrouiller après 5 tentatives
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();

      await LoginHistory.create({
        userId: user.id,
        email: user.email,
        loginStatus: 'FAILED',
        failureReason: 'Mot de passe incorrect',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
        attemptsRemaining: 5 - user.failedLoginAttempts
      });
    }

    // Vérifier si l'entreprise est active
    if (user.company && !user.isSystemAdmin) {
      if (user.company.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          message: 'L\'entreprise associée à ce compte est inactive'
        });
      }

      if (user.company.subscriptionStatus === 'EXPIRED') {
        return res.status(403).json({
          success: false,
          message: 'L\'abonnement de votre entreprise a expiré'
        });
      }
    }

    // Réinitialiser les tentatives échouées
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    user.lastActivityAt = new Date();
    await user.save();

    // Récupérer les rôles et permissions de l'utilisateur
    let permissions = [];
    try {
      const userRoles = await UserRole.findAll({
        where: { userId: user.id, isActive: true },
        include: [{
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }]
      });

      const permissionsSet = new Set();
      
      // Admin système a toutes les permissions
      if (user.isSystemAdmin) {
        const allPermissions = await Permission.findAll();
        allPermissions.forEach(p => permissionsSet.add(p.code));
      } else {
        userRoles.forEach(userRole => {
          userRole.role?.permissions?.forEach(permission => {
            permissionsSet.add(permission.code);
          });
        });
      }
      
      permissions = Array.from(permissionsSet);
    } catch (roleError) {
      logger.warn('Erreur lors de la récupération des rôles:', roleError.message);
      permissions = [];
    }

    // Générer les tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Créer une session
    const session = await UserSession.create({
      userId: user.id,
      sessionToken: accessToken,
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceInfo: {
        browser: req.useragent?.browser,
        os: req.useragent?.os,
        platform: req.useragent?.platform
      },
      expiresAt: rememberMe 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
        : new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 heures
    });

    // Enregistrer la connexion réussie
    await LoginHistory.create({
      userId: user.id,
      email: user.email,
      loginStatus: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Audit log
    await AuditLog.create({
      userId: user.id,
      companyId: user.companyId,
      actionType: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      actionDescription: `Connexion réussie - ${user.email}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    // Vérifier si le mot de passe doit être changé
    const requiresPasswordChange = user.isTemporaryPassword || 
      (user.passwordChangedAt && 
       new Date() - user.passwordChangedAt > 90 * 24 * 60 * 60 * 1000); // 90 jours

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          company: user.company ? {
            id: user.company.id,
            name: user.company.name,
            status: user.company.status,
            subscriptionStatus: user.company.subscriptionStatus,
            modules: user.company.subscriptionStatus === 'ACTIVE' ? 
              ['DASHBOARD', 'MESSAGING', 'MEETING', 'NOTIFICATION', 'LOGISTICS', 'ACCOUNTING'] : 
              ['DASHBOARD', 'MESSAGING', 'MEETING', 'NOTIFICATION']
          } : null,
          isSystemAdmin: user.isSystemAdmin,
          isCompanyAdmin: user.isCompanyAdmin,
          requiresPasswordChange,
          permissions
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.jwt.accessExpirationMinutes * 60
        },
        sessionId: session.id
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la connexion:', error);
    next(error);
  }
};

/**
 * Déconnexion
 */
exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Désactiver la session
      await UserSession.update(
        {
          isActive: false,
          loggedOutAt: new Date()
        },
        {
          where: {
            sessionToken: token
          }
        }
      );
    }

    // Audit log
    if (req.user) {
      await AuditLog.create({
        userId: req.user.id,
        companyId: req.user.companyId,
        actionType: 'LOGOUT',
        entityType: 'USER',
        entityId: req.user.id,
        actionDescription: `Déconnexion - ${req.user.email}`,
        status: 'SUCCESS',
        ipAddress: req.ip
      });
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    logger.error('Erreur lors de la déconnexion:', error);
    next(error);
  }
};

/**
 * Rafraîchir le token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis'
      });
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    
    const session = await UserSession.findOne({
      where: {
        refreshToken,
        isActive: true,
        userId: decoded.id
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide ou expiré'
      });
    }

    const user = await User.findByPk(decoded.id, {
      include: [{ model: Company, as: 'company' }]
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur inactif ou supprimé'
      });
    }

    // Générer un nouveau access token
    const newAccessToken = user.generateAuthToken();
    
    // Mettre à jour la session
    await session.update({
      sessionToken: newAccessToken,
      lastActivityAt: new Date()
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: config.jwt.accessExpirationMinutes * 60
      }
    });

  } catch (error) {
    logger.error('Erreur lors du rafraîchissement du token:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide ou expiré'
      });
    }
    
    next(error);
  }
};

/**
 * Changer le mot de passe
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
      });
    }

    const user = await User.findByPk(userId);

    // Vérifier le mot de passe actuel
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Vérifier que le nouveau mot de passe est différent
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit être différent de l\'ancien'
      });
    }

    // Mettre à jour le mot de passe
    user.passwordHash = newPassword;
    user.isTemporaryPassword = false;
    user.passwordChangedAt = new Date();
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    // Révoquer toutes les sessions sauf celle-ci
    const currentToken = req.headers.authorization?.split(' ')[1];
    if (currentToken) {
      await UserSession.update(
        { isActive: false },
        {
          where: {
            userId: user.id,
            sessionToken: { [Op.ne]: currentToken }
          }
        }
      );
    }

    // Envoyer notification
    await createNotification({
      userId: user.id,
      type: 'PASSWORD_CHANGED',
      title: 'Mot de passe modifié',
      message: 'Votre mot de passe a été modifié avec succès.',
      priority: 'HIGH'
    });

    // Envoyer email de confirmation
    await sendEmail({
      to: user.email,
      subject: 'LogSys - Votre mot de passe a été modifié',
      template: 'password-changed',
      data: {
        fullName: user.fullName
      }
    }).catch(err => logger.warn('Erreur envoi email confirmation:', err));

    // Audit log
    await AuditLog.create({
      userId: user.id,
      companyId: user.companyId,
      actionType: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      actionDescription: 'Changement de mot de passe',
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    logger.error('Erreur lors du changement de mot de passe:', error);
    next(error);
  }
};

/**
 * Mot de passe oublié
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    const user = await User.findOne({ where: { email } });

    // Ne pas révéler si l'email existe ou non (sécurité)
    if (!user) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Envoyer l'email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'LogSys - Réinitialisation de votre mot de passe',
      template: 'password-reset',
      data: {
        fullName: user.fullName,
        resetUrl,
        expiresIn: `${config.jwt.resetPasswordExpirationMinutes} minutes`
      }
    }).catch(err => logger.warn('Erreur envoi email réinitialisation:', err));

    res.json({
      success: true,
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation'
    });

  } catch (error) {
    logger.error('Erreur lors de la demande de réinitialisation:', error);
    next(error);
  }
};

/**
 * Réinitialiser le mot de passe
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token et nouveau mot de passe requis'
      });
    }

    // Validation du mot de passe
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
      });
    }

    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Token de réinitialisation invalide ou expiré'
      });
    }
    
    const user = await User.findOne({
      where: {
        id: decoded.id,
        passwordResetToken: token,
        passwordResetExpiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de réinitialisation invalide ou expiré'
      });
    }

    // Mettre à jour le mot de passe
    user.passwordHash = newPassword;
    user.isTemporaryPassword = false;
    user.passwordChangedAt = new Date();
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    // Révoquer toutes les sessions
    await UserSession.update(
      { isActive: false },
      { where: { userId: user.id } }
    );

    // Envoyer notification
    await createNotification({
      userId: user.id,
      type: 'PASSWORD_RESET',
      title: 'Mot de passe réinitialisé',
      message: 'Votre mot de passe a été réinitialisé avec succès.',
      priority: 'HIGH'
    });

    // Audit log
    await AuditLog.create({
      userId: user.id,
      companyId: user.companyId,
      actionType: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      actionDescription: 'Réinitialisation du mot de passe',
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    logger.error('Erreur lors de la réinitialisation du mot de passe:', error);
    next(error);
  }
};

/**
 * Vérifier l'email
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requis'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide ou expiré'
      });
    }
    
    const user = await User.findOne({
      where: {
        id: decoded.id,
        emailVerificationToken: token
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide'
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    
    // Activer le compte s'il était en attente
    if (user.status === 'PENDING_ACTIVATION') {
      user.status = 'ACTIVE';
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'Email vérifié avec succès'
    });

  } catch (error) {
    logger.error('Erreur lors de la vérification de l\'email:', error);
    next(error);
  }
};

/**
 * Obtenir le profil de l'utilisateur connecté
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Company,
          as: 'company'
        },
        {
          model: UserType,
          as: 'userType'
        },
        {
          model: db.JobPosition,
          as: 'jobPosition'
        }
      ],
      attributes: {
        exclude: ['passwordHash', 'passwordResetToken', 'twoFactorSecret']
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer les permissions
    let permissions = [];
    try {
      const userRoles = await UserRole.findAll({
        where: { userId: user.id, isActive: true },
        include: [{
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }]
      });

      const permissionsSet = new Set();
      
      if (user.isSystemAdmin) {
        const allPermissions = await Permission.findAll();
        allPermissions.forEach(p => permissionsSet.add(p.code));
      } else {
        userRoles.forEach(userRole => {
          userRole.role?.permissions?.forEach(permission => {
            permissionsSet.add(permission.code);
          });
        });
      }
      
      permissions = Array.from(permissionsSet);
    } catch (roleError) {
      logger.warn('Erreur récupération rôles profil:', roleError.message);
    }

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        permissions
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du profil:', error);
    next(error);
  }
};

/**
 * Mettre à jour le profil de l'utilisateur connecté
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      phoneCountryCode,
      languagePreference,
      timezone,
      notificationPreferences,
      avatarUrl
    } = req.body;

    const allowedFields = [
      'firstName', 'lastName', 'phoneNumber', 'phoneCountryCode',
      'languagePreference', 'timezone', 'notificationPreferences', 'avatarUrl'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await req.user.update(updateData);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      actionType: 'UPDATE',
      entityType: 'USER',
      entityId: req.user.id,
      entityName: req.user.fullName,
      actionDescription: `Mise à jour du profil`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: req.user
    });

  } catch (error) {
    logger.error('Erreur lors de la mise à jour du profil:', error);
    next(error);
  }
};