const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { createNotification, notifySystemAdmins } = require('../services/notification.service');
const { sendEmail } = require('../services/email.service');

const { SubscriptionPlan, CompanySubscription, Company, User, sequelize } = db;

/**
 * Récupérer tous les plans d'abonnement
 */
exports.getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      include: ['modules'],
      order: [['pricePerUser', 'ASC']]
    });

    res.json({
      success: true,
      data: plans
    });

  } catch (error) {
    logger.error('Erreur récupération plans:', error);
    next(error);
  }
};

/**
 * Récupérer l'abonnement d'une entreprise
 */
exports.getCompanySubscription = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!req.user.isSystemAdmin && req.user.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const subscription = await CompanySubscription.findOne({
      where: { companyId, status: 'ACTIVE' },
      include: ['plan']
    });

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    logger.error('Erreur récupération abonnement:', error);
    next(error);
  }
};

/**
 * Créer un abonnement
 */
exports.createSubscription = async (req, res, next) => {
  try {
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs système'
      });
    }

    const { companyId, planCode, userCount, paymentMethod } = req.body;

    const plan = await SubscriptionPlan.findOne({ where: { code: planCode } });
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan invalide'
      });
    }

    // Désactiver l'ancien abonnement
    await CompanySubscription.update(
      { status: 'CANCELLED', cancelledAt: new Date() },
      { where: { companyId, status: 'ACTIVE' } }
    );

    const subscription = await CompanySubscription.create({
      companyId,
      planId: plan.id,
      userCount: Math.min(userCount, plan.maxUsers),
      pricePerUser: plan.pricePerUser,
      totalAmount: plan.pricePerUser * Math.min(userCount, plan.maxUsers),
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: plan.pricePerUser === 0 ? 'ACTIVE' : 'PENDING_PAYMENT',
      paymentMethod,
      createdBy: req.user.id
    });

    await subscription.update({
      subscriptionNumber: `SUB${subscription.id.slice(0, 10).toUpperCase()}`
    });

    await Company.update(
      { subscriptionStatus: subscription.status },
      { where: { id: companyId } }
    );

    res.status(201).json({
      success: true,
      data: subscription
    });

  } catch (error) {
    logger.error('Erreur création abonnement:', error);
    next(error);
  }
};

/**
 * Mettre à jour un abonnement
 */
exports.updateSubscription = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { planCode, userCount } = req.body;

    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const plan = await SubscriptionPlan.findOne({ where: { code: planCode } });
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan invalide'
      });
    }

    const subscription = await CompanySubscription.findOne({
      where: { companyId, status: 'ACTIVE' }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement actif'
      });
    }

    await subscription.update({
      planId: plan.id,
      userCount: Math.min(userCount, plan.maxUsers),
      pricePerUser: plan.pricePerUser,
      totalAmount: plan.pricePerUser * Math.min(userCount, plan.maxUsers)
    });

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    logger.error('Erreur mise à jour abonnement:', error);
    next(error);
  }
};

/**
 * Annuler un abonnement
 */
exports.cancelSubscription = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { reason } = req.body;

    const canCancel = req.user.isSystemAdmin || 
      (req.user.isCompanyAdmin && req.user.companyId === companyId);

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const subscription = await CompanySubscription.findOne({
      where: { companyId, status: 'ACTIVE' }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement actif'
      });
    }

    await subscription.update({
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: req.user.id,
      cancellationReason: reason,
      autoRenew: false
    });

    await Company.update(
      { subscriptionStatus: 'CANCELLED' },
      { where: { id: companyId } }
    );

    await notifySystemAdmins({
      type: 'SUBSCRIPTION_CANCELLED',
      title: 'Abonnement annulé',
      message: `L'abonnement de l'entreprise a été annulé`,
      priority: 'NORMAL'
    });

    res.json({
      success: true,
      message: 'Abonnement annulé avec succès'
    });

  } catch (error) {
    logger.error('Erreur annulation abonnement:', error);
    next(error);
  }
};

/**
 * Réactiver un abonnement
 */
exports.reactivateSubscription = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs système'
      });
    }

    const lastSubscription = await CompanySubscription.findOne({
      where: { companyId },
      order: [['createdAt', 'DESC']]
    });

    if (!lastSubscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement trouvé'
      });
    }

    const subscription = await CompanySubscription.create({
      companyId,
      planId: lastSubscription.planId,
      userCount: lastSubscription.userCount,
      pricePerUser: lastSubscription.pricePerUser,
      totalAmount: lastSubscription.totalAmount,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      createdBy: req.user.id
    });

    await subscription.update({
      subscriptionNumber: `SUB${subscription.id.slice(0, 10).toUpperCase()}`
    });

    await Company.update(
      { subscriptionStatus: 'ACTIVE' },
      { where: { id: companyId } }
    );

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    logger.error('Erreur réactivation abonnement:', error);
    next(error);
  }
};

/**
 * Récupérer l'historique des abonnements
 */
exports.getSubscriptionHistory = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!req.user.isSystemAdmin && req.user.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const history = await CompanySubscription.findAll({
      where: { companyId },
      include: ['plan'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    logger.error('Erreur historique abonnement:', error);
    next(error);
  }
};

/**
 * Récupérer la prochaine facture
 */
exports.getUpcomingInvoice = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!req.user.isSystemAdmin && req.user.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const subscription = await CompanySubscription.findOne({
      where: { companyId, status: 'ACTIVE' },
      include: ['plan']
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Aucun abonnement actif'
      });
    }

    const invoice = {
      subscriptionNumber: subscription.subscriptionNumber,
      planName: subscription.plan.name,
      amount: subscription.totalAmount,
      currency: subscription.currency,
      nextBillingDate: subscription.nextBillingDate,
      userCount: subscription.userCount,
      pricePerUser: subscription.pricePerUser
    };

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    logger.error('Erreur facture à venir:', error);
    next(error);
  }
};

/**
 * Récupérer les abonnements expirant bientôt
 */
exports.getExpiringSubscriptions = async (req, res, next) => {
  try {
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs système'
      });
    }

    const expiring = await CompanySubscription.findAll({
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
        { model: Company, as: 'company', attributes: ['id', 'name', 'email'] },
        { model: SubscriptionPlan, as: 'plan', attributes: ['name'] }
      ]
    });

    res.json({
      success: true,
      data: expiring.map(sub => ({
        id: sub.id,
        company: sub.company,
        plan: sub.plan,
        endDate: sub.endDate,
        daysRemaining: Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    });

  } catch (error) {
    logger.error('Erreur récupération abonnements expirants:', error);
    next(error);
  }
};

/**
 * Statistiques des abonnements
 */
exports.getSubscriptionStats = async (req, res, next) => {
  try {
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs système'
      });
    }

    const stats = {
      totalActive: await CompanySubscription.count({ where: { status: 'ACTIVE' } }),
      byPlan: await CompanySubscription.findAll({
        attributes: [
          [sequelize.col('plan.name'), 'planName'],
          [sequelize.fn('COUNT', '*'), 'count']
        ],
        include: [{ model: SubscriptionPlan, as: 'plan', attributes: [] }],
        where: { status: 'ACTIVE' },
        group: ['plan.id', 'plan.name']
      }),
      monthlyRevenue: await CompanySubscription.sum('totalAmount', {
        where: { status: 'ACTIVE' }
      }),
      expiringCount: await CompanySubscription.count({
        where: {
          status: 'ACTIVE',
          endDate: { [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        }
      })
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Erreur stats abonnements:', error);
    next(error);
  }
};