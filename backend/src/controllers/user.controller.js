const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/email.service');
const { sendSMS } = require('../services/sms.service');
const { createNotification } = require('../services/notification.service');
const { generateTemporaryPassword } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

const { User, Company, UserType, JobPosition, Role, UserRole, AuditLog } = db;

/**
 * Récupérer tous les utilisateurs (avec filtres)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      companyId,
      userTypeId,
      isCompanyAdmin,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const where = {};
    
    // Filtres selon les permissions
    if (!req.user.isSystemAdmin) {
      where.companyId = req.user.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { fullName: { [Op.iLike]: `%${search}%` } },
        { userCode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) where.status = status;
    if (userTypeId) where.userTypeId = userTypeId;
    if (isCompanyAdmin !== undefined) where.isCompanyAdmin = isCompanyAdmin === 'true';

    const { count, rows: users } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'companyCode']
        },
        {
          model: UserType,
          as: 'userType',
          attributes: ['id', 'code', 'name']
        },
        {
          model: JobPosition,
          as: 'jobPosition',
          attributes: ['id', 'code', 'title']
        },
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }
      ],
      attributes: {
        exclude: ['passwordHash', 'passwordResetToken', 'twoFactorSecret']
      },
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des utilisateurs:', error);
    next(error);
  }
};

/**
 * Récupérer un utilisateur par ID
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
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
          model: JobPosition,
          as: 'jobPosition'
        },
        {
          model: Role,
          as: 'roles'
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

    // Vérifier les permissions
    const canView = req.user.isSystemAdmin || 
                   req.user.isCompanyAdmin || 
                   req.user.id === user.id ||
                   req.user.companyId === user.companyId;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cet utilisateur'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
    next(error);
  }
};

/**
 * Créer un nouvel utilisateur
 */
exports.createUser = async (req, res, next) => {
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

    // Vérifier les permissions
    if (!req.user.isSystemAdmin && !req.user.isCompanyAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes pour créer un utilisateur'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Vérifier la limite d'utilisateurs de l'entreprise
    if (!req.user.isSystemAdmin) {
      const company = await Company.findByPk(companyId || req.user.companyId, {
        include: ['activeSubscription']
      });

      const currentUsers = await User.count({
        where: { companyId: company.id, status: 'ACTIVE' }
      });

      if (currentUsers >= company.activeSubscription?.userCount) {
        return res.status(400).json({
          success: false,
          message: 'Limite d\'utilisateurs atteinte pour cet abonnement'
        });
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
      companyId: companyId || req.user.companyId,
      userTypeId,
      jobPositionId,
      isCompanyAdmin,
      passwordHash: temporaryPassword,
      isTemporaryPassword: true,
      status: 'PENDING_ACTIVATION'
    });

    await user.update({
      userCode: `USR${user.id.slice(0, 8).toUpperCase()}`
    });

    // Assigner les rôles
    if (roles.length > 0) {
      await UserRole.bulkCreate(
        roles.map(roleId => ({
          userId: user.id,
          roleId,
          assignedBy: req.user.id
        }))
      );
    }

    // Envoyer les identifiants par email
    await sendEmail({
      to: user.email,
      subject: 'Bienvenue sur LogSys CRM - Vos identifiants',
      template: 'welcome-user',
      data: {
        fullName: user.fullName,
        email: user.email,
        temporaryPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        companyName: user.company?.name
      }
    });

    // Envoyer par SMS
    if (phoneNumber && phoneCountryCode) {
      await sendSMS({
        to: `${phoneCountryCode}${phoneNumber}`,
        message: `LogSys: Votre compte a été créé. Email: ${email} | MDP temporaire: ${temporaryPassword}`
      });
    }

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
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
    logger.error('Erreur lors de la création de l\'utilisateur:', error);
    next(error);
  }
};

/**
 * Mettre à jour un utilisateur
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier les permissions
    const canUpdate = req.user.isSystemAdmin || 
                     req.user.isCompanyAdmin || 
                     req.user.id === user.id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour modifier cet utilisateur'
      });
    }

    // Champs modifiables selon le rôle
    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'phoneCountryCode', 
                          'jobPositionId', 'notificationPreferences', 'languagePreference', 'timezone'];

    if (req.user.isSystemAdmin || req.user.isCompanyAdmin) {
      allowedFields.push('status', 'userTypeId', 'isCompanyAdmin');
    }

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const oldData = { ...user.toJSON() };
    await user.update(filteredData);

    // Mettre à jour les rôles si fournis
    if (updateData.roles && (req.user.isSystemAdmin || req.user.isCompanyAdmin)) {
      await UserRole.destroy({ where: { userId: user.id } });
      await UserRole.bulkCreate(
        updateData.roles.map(roleId => ({
          userId: user.id,
          roleId,
          assignedBy: req.user.id
        }))
      );
    }

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      companyId: user.companyId,
      actionType: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      entityName: user.fullName,
      actionDescription: `Mise à jour de l'utilisateur ${user.email}`,
      status: 'SUCCESS',
      ipAddress: req.ip,
      oldValues: oldData,
      newValues: filteredData
    });

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: user
    });

  } catch (error) {
    logger.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    next(error);
  }
};

/**
 * Supprimer un utilisateur (soft delete)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier les permissions
    const canDelete = req.user.isSystemAdmin || 
                     (req.user.isCompanyAdmin && req.user.companyId === user.companyId);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour supprimer cet utilisateur'
      });
    }

    // Ne pas supprimer le dernier admin de l'entreprise
    if (user.isCompanyAdmin) {
      const otherAdmins = await User.count({
        where: {
          companyId: user.companyId,
          isCompanyAdmin: true,
          id: { [Op.ne]: user.id },
          status: 'ACTIVE'
        }
      });

      if (otherAdmins === 0) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer le dernier administrateur de l\'entreprise'
        });
      }
    }

    const userEmail = user.email;
    await user.destroy();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      companyId: user.companyId,
      actionType: 'DELETE',
      entityType: 'USER',
      entityId: user.id,
      entityName: user.fullName,
      actionDescription: `Suppression de l'utilisateur ${userEmail}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression de l\'utilisateur:', error);
    next(error);
  }
};

/**
 * Réinitialiser le mot de passe d'un utilisateur (admin uniquement)
 */
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier les permissions
    const canReset = req.user.isSystemAdmin || 
                    (req.user.isCompanyAdmin && req.user.companyId === user.companyId);

    if (!canReset) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    user.passwordHash = temporaryPassword;
    user.isTemporaryPassword = true;
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    // Envoyer les nouveaux identifiants
    await sendEmail({
      to: user.email,
      subject: 'LogSys - Réinitialisation de votre mot de passe',
      template: 'password-reset-admin',
      data: {
        fullName: user.fullName,
        email: user.email,
        temporaryPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      }
    });

    if (user.phoneNumber && user.phoneCountryCode) {
      await sendSMS({
        to: `${user.phoneCountryCode}${user.phoneNumber}`,
        message: `LogSys: Votre mot de passe a été réinitialisé. Nouveau MDP: ${temporaryPassword}`
      });
    }

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      companyId: user.companyId,
      actionType: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      entityName: user.fullName,
      actionDescription: `Réinitialisation du mot de passe de ${user.email}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      data: {
        temporaryPassword: process.env.NODE_ENV === 'development' ? temporaryPassword : undefined
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la réinitialisation du mot de passe:', error);
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
          as: 'company',
          include: ['activeSubscription']
        },
        {
          model: UserType,
          as: 'userType'
        },
        {
          model: JobPosition,
          as: 'jobPosition'
        },
        {
          model: Role,
          as: 'roles',
          include: ['permissions']
        }
      ],
      attributes: {
        exclude: ['passwordHash', 'passwordResetToken', 'twoFactorSecret']
      }
    });

    // Récupérer les permissions
    const permissions = new Set();
    user.roles?.forEach(role => {
      role.permissions?.forEach(permission => {
        permissions.add(permission.code);
      });
    });

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        permissions: Array.from(permissions)
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
    const updateData = req.body;
    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'phoneCountryCode',
                          'notificationPreferences', 'languagePreference', 'timezone', 'avatarUrl'];

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    await req.user.update(filteredData);

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