const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/email.service');
const { sendSMS } = require('../services/sms.service');
const { createNotification } = require('../services/notification.service');
const { generateTemporaryPassword } = require('../utils/helpers');
const config = require('../config/config');

const {
  Company,
  User,
  CompanySubscription,
  SubscriptionPlan,
  BusinessSector,
  Country,
  JobPosition,
  AuditLog,
  UserType,
  CompanySetting,
  sequelize
} = db;

/**
 * Créer une nouvelle entreprise
 */
exports.createCompany = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      legalName,
      taxNumber,
      businessSectorId,
      countryId,
      address,
      city,
      postalCode,
      email,
      phoneCountryCode,
      phoneNumber,
      website,
      executiveName,
      executivePositionId,
      executiveEmail,
      executivePhoneCode,
      executivePhone,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPhoneCountryCode,
      adminPhoneNumber,
      adminJobPositionId,
      planCode = 'BASIC',
      userCount = 5
    } = req.body;

    // Vérifier si l'email de l'entreprise existe déjà
    const existingCompany = await Company.findOne({
      where: {
        [Op.or]: [
          { email },
          ...(taxNumber ? [{ taxNumber }] : [])
        ]
      }
    });

    if (existingCompany) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Une entreprise avec cet email ou numéro fiscal existe déjà'
      });
    }

    // Vérifier si l'email admin existe déjà
    const existingAdmin = await User.findOne({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email administrateur existe déjà'
      });
    }

    // ✅ CORRECTION : Générer le code entreprise AVANT la création
    const companyCode = `COMP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Créer l'entreprise avec le code généré
    const company = await Company.create({
      companyCode,  // ← AJOUT IMPORTANT
      name,
      legalName,
      taxNumber,
      businessSectorId,
      countryId,
      address,
      city,
      postalCode,
      email,
      phoneCountryCode,
      phoneNumber,
      website,
      executiveName,
      executivePositionId,
      executiveEmail,
      executivePhoneCode,
      executivePhone,
      status: 'ACTIVE',
      registrationDate: new Date(),
      createdBy: req.user?.id
    }, { transaction });

    // Le code est déjà défini, pas besoin de update supplémentaire
    // await company.update({ companyCode: ... }); ← SUPPRIMÉ

    const plan = await SubscriptionPlan.findOne({
      where: { code: planCode }
    });

    if (!plan) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Plan d\'abonnement invalide'
      });
    }

    const subscription = await CompanySubscription.create({
      companyId: company.id,
      planId: plan.id,
      userCount: Math.min(userCount, plan.maxUsers),
      pricePerUser: plan.pricePerUser,
      totalAmount: plan.pricePerUser * Math.min(userCount, plan.maxUsers),
      currency: 'USD',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: plan.pricePerUser === 0 ? 'ACTIVE' : 'PENDING_PAYMENT',
      autoRenew: true,
      createdBy: req.user?.id
    }, { transaction });

    await subscription.update({
      subscriptionNumber: `SUB${subscription.id.slice(0, 10).toUpperCase()}`
    }, { transaction });

    const companyAdminType = await UserType.findOne({
      where: { code: 'COMPANY_ADMIN' }
    });

    const temporaryPassword = generateTemporaryPassword();

    const adminUser = await User.create({
      email: adminEmail,
      firstName: adminFirstName,
      lastName: adminLastName,
      phoneCountryCode: adminPhoneCountryCode,
      phoneNumber: adminPhoneNumber,
      companyId: company.id,
      userTypeId: companyAdminType?.id,
      jobPositionId: adminJobPositionId,
      isCompanyAdmin: true,
      passwordHash: temporaryPassword,
      isTemporaryPassword: true,
      status: 'PENDING_ACTIVATION',
      createdBy: req.user?.id
    }, { transaction });

    await adminUser.update({
      userCode: `USR${adminUser.id.slice(0, 8).toUpperCase()}`
    }, { transaction });

    await transaction.commit();

    // Envoyer les emails et SMS (hors transaction)
    await sendEmail({
      to: executiveEmail,
      subject: `LogSys - Création de votre entreprise ${company.name}`,
      template: 'company-created-executive',
      data: {
        executiveName,
        companyName: company.name,
        adminName: `${adminFirstName} ${adminLastName}`,
        adminEmail,
        planName: plan.name,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      }
    }).catch(err => logger.warn('Erreur envoi email dirigeant:', err));

    if (executivePhone && executivePhoneCode) {
      await sendSMS({
        to: `${executivePhoneCode}${executivePhone}`,
        message: `LogSys: Votre entreprise ${company.name} a été créée. L'administrateur ${adminFirstName} ${adminLastName} peut se connecter avec l'email ${adminEmail}`
      }).catch(err => logger.warn('Erreur envoi SMS dirigeant:', err));
    }

    await sendEmail({
      to: adminEmail,
      subject: 'LogSys - Vos identifiants administrateur',
      template: 'welcome-company-admin',
      data: {
        fullName: `${adminFirstName} ${adminLastName}`,
        companyName: company.name,
        email: adminEmail,
        temporaryPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      }
    }).catch(err => logger.warn('Erreur envoi email admin:', err));

    if (adminPhoneNumber && adminPhoneCountryCode) {
      await sendSMS({
        to: `${adminPhoneCountryCode}${adminPhoneNumber}`,
        message: `LogSys: Votre compte admin pour ${company.name} est créé. Email: ${adminEmail} | MDP: ${temporaryPassword}`
      }).catch(err => logger.warn('Erreur envoi SMS admin:', err));
    }

    if (req.user) {
      await createNotification({
        userId: req.user.id,
        type: 'COMPANY_CREATED',
        title: 'Nouvelle entreprise créée',
        message: `L'entreprise ${company.name} a été créée avec le plan ${plan.name}`,
        priority: 'NORMAL',
        actionUrl: `/admin/companies/${company.id}`
      }).catch(err => logger.warn('Erreur création notification:', err));
    }

    await AuditLog.create({
      userId: req.user?.id,
      actionType: 'CREATE',
      entityType: 'COMPANY',
      entityId: company.id,
      entityName: company.name,
      actionDescription: `Création de l'entreprise ${company.name} avec plan ${plan.name}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Entreprise créée avec succès',
      data: {
        company: {
          id: company.id,
          name: company.name,
          code: company.companyCode,
          status: company.status
        },
        subscription: {
          plan: plan.name,
          userCount: subscription.userCount,
          endDate: subscription.endDate,
          status: subscription.status
        },
        adminCredentials: {
          email: adminEmail,
          temporaryPassword: process.env.NODE_ENV === 'development' ? temporaryPassword : undefined,
          message: 'Veuillez communiquer ces identifiants à l\'administrateur de l\'entreprise'
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur lors de la création de l\'entreprise:', error);
    next(error);
  }
};

/**
 * Récupérer toutes les entreprises (admin système uniquement)
 */
exports.getAllCompanies = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      subscriptionStatus,
      sectorId,
      countryId,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { legalName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { companyCode: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (status) where.status = status;
    if (subscriptionStatus) where.subscriptionStatus = subscriptionStatus;
    if (sectorId) where.businessSectorId = sectorId;
    if (countryId) where.countryId = countryId;

    const { count, rows: companies } = await Company.findAndCountAll({
      where,
      include: [
        {
          model: BusinessSector,
          as: 'businessSector',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Country,
          as: 'country',
          attributes: ['id', 'name', 'code', 'phoneCode']
        },
        {
          model: CompanySubscription,
          as: 'activeSubscription',
          include: [{
            model: SubscriptionPlan,
            as: 'plan',
            attributes: ['id', 'name', 'code']
          }]
        }
      ],
      attributes: {
        include: [
          [Sequelize.literal(`(
            SELECT COUNT(*) 
            FROM users 
            WHERE users.company_id = "Company".id 
            AND users.status = 'ACTIVE' 
            AND users.deleted_at IS NULL
          )`), 'activeUsersCount']
        ]
      },
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true,
      subQuery: false
    });

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          total: count.length || count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((count.length || count) / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des entreprises:', error);
    next(error);
  }
};

/**
 * Récupérer une entreprise par ID
 */
exports.getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id, {
      include: [
        {
          model: BusinessSector,
          as: 'businessSector'
        },
        {
          model: Country,
          as: 'country'
        },
        {
          model: JobPosition,
          as: 'executivePosition'
        },
        {
          model: CompanySubscription,
          as: 'subscriptions',
          include: [{
            model: SubscriptionPlan,
            as: 'plan'
          }],
          limit: 10,
          order: [['createdAt', 'DESC']]
        },
        {
          model: CompanySubscription,
          as: 'activeSubscription',
          include: [{
            model: SubscriptionPlan,
            as: 'plan'
          }]
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'email', 'fullName', 'status', 'isCompanyAdmin', 'lastLoginAt'],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }

    if (!req.user.isSystemAdmin && req.user.companyId !== company.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette entreprise'
      });
    }

    const stats = {
      totalUsers: await User.count({ where: { companyId: company.id } }),
      activeUsers: await User.count({ where: { companyId: company.id, status: 'ACTIVE' } }),
      totalSubscriptions: company.subscriptions?.length || 0,
      currentPlan: company.activeSubscription?.plan?.name,
      daysUntilExpiration: company.activeSubscription
        ? Math.ceil((new Date(company.activeSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        : 0
    };

    res.json({
      success: true,
      data: {
        ...company.toJSON(),
        stats
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'entreprise:', error);
    next(error);
  }
};

/**
 * Mettre à jour une entreprise
 */
exports.updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }

    const canUpdate = req.user.isSystemAdmin || 
      (req.user.isCompanyAdmin && req.user.companyId === company.id);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour modifier cette entreprise'
      });
    }

    const allowedFields = req.user.isSystemAdmin
      ? ['name', 'legalName', 'taxNumber', 'businessSectorId', 'countryId', 
         'address', 'city', 'postalCode', 'email', 'phoneCountryCode', 'phoneNumber',
         'website', 'executiveName', 'executivePositionId', 'executiveEmail',
         'executivePhoneCode', 'executivePhone', 'status', 'logoUrl', 'settings']
      : ['address', 'city', 'postalCode', 'phoneCountryCode', 'phoneNumber',
         'website', 'logoUrl', 'settings'];

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    await company.update(filteredData);

    await AuditLog.create({
      userId: req.user.id,
      companyId: company.id,
      actionType: 'UPDATE',
      entityType: 'COMPANY',
      entityId: company.id,
      entityName: company.name,
      actionDescription: `Mise à jour de l'entreprise ${company.name}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Entreprise mise à jour avec succès',
      data: company
    });

  } catch (error) {
    logger.error('Erreur lors de la mise à jour de l\'entreprise:', error);
    next(error);
  }
};

/**
 * Supprimer une entreprise (admin système uniquement)
 */
exports.deleteCompany = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const company = await Company.findByPk(id, { transaction });

    if (!company) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }

    if (!req.user.isSystemAdmin) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Seul un administrateur système peut supprimer une entreprise'
      });
    }

    const activeUsers = await User.count({
      where: {
        companyId: company.id,
        status: 'ACTIVE'
      },
      transaction
    });

    if (activeUsers > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer l'entreprise: ${activeUsers} utilisateurs actifs`
      });
    }

    const companyName = company.name;

    await company.destroy({ transaction });

    await User.update(
      { status: 'INACTIVE', deletedAt: new Date() },
      { where: { companyId: company.id }, transaction }
    );

    await CompanySubscription.update(
      { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: req.user.id },
      { where: { companyId: company.id }, transaction }
    );

    await transaction.commit();

    await AuditLog.create({
      userId: req.user.id,
      actionType: 'DELETE',
      entityType: 'COMPANY',
      entityId: company.id,
      entityName: companyName,
      actionDescription: `Suppression de l'entreprise ${companyName}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Entreprise supprimée avec succès'
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur lors de la suppression de l\'entreprise:', error);
    next(error);
  }
};

/**
 * Mettre à jour l'abonnement d'une entreprise
 */
exports.updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { planCode, userCount, action } = req.body;

    const company = await Company.findByPk(id, {
      include: [{
        model: CompanySubscription,
        as: 'activeSubscription'
      }]
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }

    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Seul un administrateur système peut gérer les abonnements'
      });
    }

    let subscription = company.activeSubscription;
    let message = '';

    switch (action) {
      case 'upgrade':
      case 'downgrade':
        const newPlan = await SubscriptionPlan.findOne({
          where: { code: planCode }
        });

        if (!newPlan) {
          return res.status(400).json({
            success: false,
            message: 'Plan d\'abonnement invalide'
          });
        }

        if (subscription) {
          await subscription.update({
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: req.user.id
          });
        }

        subscription = await CompanySubscription.create({
          companyId: company.id,
          planId: newPlan.id,
          userCount: Math.min(userCount || newPlan.maxUsers, newPlan.maxUsers),
          pricePerUser: newPlan.pricePerUser,
          totalAmount: newPlan.pricePerUser * Math.min(userCount || newPlan.maxUsers, newPlan.maxUsers),
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: newPlan.pricePerUser === 0 ? 'ACTIVE' : 'PENDING_PAYMENT',
          createdBy: req.user.id
        });

        await subscription.update({
          subscriptionNumber: `SUB${subscription.id.slice(0, 10).toUpperCase()}`
        });

        message = `Abonnement changé vers le plan ${newPlan.name}`;
        break;

      case 'cancel':
        if (!subscription) {
          return res.status(400).json({
            success: false,
            message: 'Aucun abonnement actif à annuler'
          });
        }

        await subscription.update({
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: req.user.id,
          autoRenew: false,
          cancellationReason: req.body.reason || 'Annulation manuelle'
        });

        await company.update({ subscriptionStatus: 'CANCELLED' });
        message = 'Abonnement annulé avec succès';
        break;

      case 'reactivate':
        if (!subscription || subscription.status !== 'CANCELLED') {
          return res.status(400).json({
            success: false,
            message: 'Aucun abonnement annulé à réactiver'
          });
        }

        subscription = await CompanySubscription.create({
          companyId: company.id,
          planId: subscription.planId,
          userCount: subscription.userCount,
          pricePerUser: subscription.pricePerUser,
          totalAmount: subscription.totalAmount,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          createdBy: req.user.id
        });

        await subscription.update({
          subscriptionNumber: `SUB${subscription.id.slice(0, 10).toUpperCase()}`
        });

        await company.update({ subscriptionStatus: 'ACTIVE' });
        message = 'Abonnement réactivé avec succès';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Action invalide'
        });
    }

    await createNotification({
      companyId: company.id,
      type: 'SUBSCRIPTION_UPDATED',
      title: 'Abonnement mis à jour',
      message,
      priority: 'HIGH'
    }).catch(err => logger.warn('Erreur notification abonnement:', err));

    await AuditLog.create({
      userId: req.user.id,
      companyId: company.id,
      actionType: 'UPDATE',
      entityType: 'SUBSCRIPTION',
      entityId: subscription.id,
      actionDescription: message,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message,
      data: subscription
    });

  } catch (error) {
    logger.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    next(error);
  }
};

/**
 * Obtenir les statistiques des entreprises
 */
exports.getCompaniesStats = async (req, res, next) => {
  try {
    const totalCompanies = await Company.count();
    const activeCompanies = await Company.count({ where: { status: 'ACTIVE' } });

    const companiesByPlan = await CompanySubscription.findAll({
      attributes: [
        [Sequelize.col('plan.name'), 'planName'],
        [Sequelize.fn('COUNT', Sequelize.col('CompanySubscription.id')), 'count']
      ],
      include: [{
        model: SubscriptionPlan,
        as: 'plan',
        attributes: []
      }],
      where: { status: 'ACTIVE' },
      group: ['plan.id', 'plan.name'],
      raw: true
    });

    const companiesBySector = await Company.findAll({
      attributes: [
        [Sequelize.col('businessSector.name'), 'sectorName'],
        [Sequelize.fn('COUNT', Sequelize.col('Company.id')), 'count']
      ],
      include: [{
        model: BusinessSector,
        as: 'businessSector',
        attributes: []
      }],
      group: ['businessSector.id', 'businessSector.name'],
      limit: 10,
      raw: true
    });

    const companiesByCountry = await Company.findAll({
      attributes: [
        [Sequelize.col('country.name'), 'countryName'],
        [Sequelize.fn('COUNT', Sequelize.col('Company.id')), 'count']
      ],
      include: [{
        model: Country,
        as: 'country',
        attributes: []
      }],
      group: ['country.id', 'country.name'],
      limit: 10,
      raw: true
    });

    const recentCompanies = await Company.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: Country,
        as: 'country',
        attributes: ['name']
      }]
    });

    const expiringSubscriptions = await CompanySubscription.findAll({
      where: {
        status: 'ACTIVE',
        endDate: {
          [Op.between]: [
            new Date(),
            new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          ]
        }
      },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'email']
        },
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['name']
        }
      ]
    });

    const monthlyRevenue = await CompanySubscription.sum('totalAmount', {
      where: { status: 'ACTIVE' }
    });

    res.json({
      success: true,
      data: {
        overview: {
          total: totalCompanies,
          active: activeCompanies,
          inactive: totalCompanies - activeCompanies,
          monthlyRevenue: monthlyRevenue || 0
        },
        byPlan: companiesByPlan,
        bySector: companiesBySector,
        byCountry: companiesByCountry,
        recent: recentCompanies,
        expiringSubscriptions: expiringSubscriptions.map(sub => ({
          companyId: sub.company.id,
          companyName: sub.company.name,
          planName: sub.plan.name,
          endDate: sub.endDate,
          daysRemaining: Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        }))
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques:', error);
    next(error);
  }
};

/**
 * Récupérer les utilisateurs d'une entreprise
 */
exports.getCompanyUsers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status, search } = req.query;

    const canAccess = req.user.isSystemAdmin || 
      (req.user.isCompanyAdmin && req.user.companyId === id) ||
      req.user.companyId === id;

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const where = { companyId: id };
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { fullName: { [Op.iLike]: `%${search}%` } },
        { userCode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['passwordHash', 'passwordResetToken', 'twoFactorSecret'] },
      include: [
        { model: UserType, as: 'userType' },
        { model: JobPosition, as: 'jobPosition' }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
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
    logger.error('Erreur récupération utilisateurs entreprise:', error);
    next(error);
  }
};

/**
 * Récupérer les paramètres d'une entreprise
 */
exports.getCompanySettings = async (req, res, next) => {
  try {
    const { id } = req.params;

    const canAccess = req.user.isSystemAdmin || 
      (req.user.isCompanyAdmin && req.user.companyId === id);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }

    const settings = await CompanySetting.findAll({ where: { companyId: id } });
    const settingsObj = {};
    settings.forEach(s => {
      let value = s.settingValue;
      if (s.settingType === 'NUMBER') value = parseFloat(value);
      else if (s.settingType === 'BOOLEAN') value = value === 'true';
      else if (s.settingType === 'JSON') value = JSON.parse(value);
      settingsObj[s.settingKey] = value;
    });

    res.json({
      success: true,
      data: {
        settings: settingsObj,
        companySettings: company.settings
      }
    });

  } catch (error) {
    logger.error('Erreur récupération paramètres entreprise:', error);
    next(error);
  }
};

/**
 * Mettre à jour les paramètres d'une entreprise
 */
exports.updateCompanySettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { settings } = req.body;

    const canAccess = req.user.isSystemAdmin || 
      (req.user.isCompanyAdmin && req.user.companyId === id);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }

    await company.update({ settings });

    await AuditLog.create({
      userId: req.user.id,
      companyId: company.id,
      actionType: 'UPDATE',
      entityType: 'COMPANY_SETTINGS',
      entityId: company.id,
      entityName: company.name,
      actionDescription: `Mise à jour des paramètres de l'entreprise`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      data: { settings }
    });

  } catch (error) {
    logger.error('Erreur mise à jour paramètres entreprise:', error);
    next(error);
  }
};

/**
 * Récupérer les rôles de l'entreprise connectée
 */
exports.getRoles = async (req, res, next) => {
  try {
    const roles = await db.Role.findAll({
      where: { companyId: req.user.companyId },
      include: ['permissions']
    });
    
    for (const role of roles) {
      role.dataValues.usersCount = await db.UserRole.count({
        where: { roleId: role.id }
      });
    }
    
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un rôle par ID
 */
exports.getRole = async (req, res, next) => {
  try {
    const role = await db.Role.findOne({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: ['permissions']
    });
    
    if (!role) {
      return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
    }
    
    res.json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer un nouveau rôle
 */
exports.createRole = async (req, res, next) => {
  try {
    const { roleName, description, permissions } = req.body;
    
    const role = await db.Role.create({
      companyId: req.user.companyId,
      roleCode: `ROLE_${Date.now()}`,
      roleName,
      description
    });
    
    if (permissions?.length) {
      await db.RolePermission.bulkCreate(
        permissions.map(permissionId => ({
          roleId: role.id,
          permissionId,
          grantedBy: req.user.id
        }))
      );
    }
    
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour un rôle
 */
exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleName, description, permissions } = req.body;
    
    const role = await db.Role.findOne({
      where: { id, companyId: req.user.companyId }
    });
    
    if (!role) {
      return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
    }
    
    await role.update({ roleName, description });
    
    if (permissions) {
      await db.RolePermission.destroy({ where: { roleId: role.id } });
      await db.RolePermission.bulkCreate(
        permissions.map(permissionId => ({
          roleId: role.id,
          permissionId,
          grantedBy: req.user.id
        }))
      );
    }
    
    res.json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un rôle
 */
exports.deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const role = await db.Role.findOne({
      where: { id, companyId: req.user.companyId }
    });
    
    if (!role) {
      return res.status(404).json({ success: false, message: 'Rôle non trouvé' });
    }
    
    const userCount = await db.UserRole.count({ where: { roleId: id } });
    if (userCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer ce rôle : ${userCount} utilisateur(s) l'utilisent` 
      });
    }
    
    await role.destroy();
    
    res.json({ success: true, message: 'Rôle supprimé' });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer toutes les permissions
 */
exports.getPermissions = async (req, res, next) => {
  try {
    const permissions = await db.Permission.findAll({
      include: ['module']
    });
    
    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};