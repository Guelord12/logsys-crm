const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');

const { User, Company, CompanySubscription, Message, MessageRecipient, Meeting, Task, Document, AuditLog } = db;

/**
 * Tableau de bord principal
 */
exports.getDashboard = async (req, res, next) => {
  try {
    if (req.user.isSystemAdmin) {
      return exports.getSystemAdminDashboard(req, res, next);
    } else if (req.user.isCompanyAdmin) {
      return exports.getCompanyAdminDashboard(req, res, next);
    } else {
      return exports.getUserDashboard(req, res, next);
    }
  } catch (error) {
    logger.error('Erreur dashboard:', error);
    next(error);
  }
};

/**
 * Tableau de bord administrateur système
 */
exports.getSystemAdminDashboard = async (req, res, next) => {
  try {
    const totalCompanies = await Company.count();
    const activeCompanies = await Company.count({ where: { status: 'ACTIVE' } });
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'ACTIVE' } });
    const activeSubscriptions = await CompanySubscription.count({ where: { status: 'ACTIVE' } });
    
    const expiringSubscriptions = await CompanySubscription.count({
      where: {
        status: 'ACTIVE',
        endDate: { [Op.between]: [new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] }
      }
    });

    const monthlyRevenue = await CompanySubscription.sum('totalAmount', {
      where: { status: 'ACTIVE' }
    });

    const recentCompanies = await Company.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: CompanySubscription, as: 'activeSubscription', include: ['plan'] }]
    });

    const recentActivity = await AuditLog.findAll({
      limit: 10,
      order: [['logTimestamp', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['fullName'] },
        { model: Company, as: 'company', attributes: ['name'] }
      ]
    });

    const companiesByPlan = await CompanySubscription.findAll({
      attributes: [
        [Sequelize.col('plan.name'), 'planName'],
        [Sequelize.fn('COUNT', Sequelize.col('CompanySubscription.id')), 'count']
      ],
      include: [{ model: db.SubscriptionPlan, as: 'plan', attributes: [] }],
      where: { status: 'ACTIVE' },
      group: ['plan.id', 'plan.name'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalCompanies,
          activeCompanies,
          totalUsers,
          activeUsers,
          activeSubscriptions,
          expiringSubscriptions,
          monthlyRevenue: monthlyRevenue || 0
        },
        recentCompanies,
        recentActivity: recentActivity.map(a => ({
          id: a.id,
          description: a.actionDescription,
          user: a.user?.fullName || 'Système',
          company: a.company?.name,
          timestamp: a.logTimestamp,
          actionType: a.actionType
        })),
        companiesByPlan
      }
    });

  } catch (error) {
    logger.error('Erreur dashboard admin système:', error);
    next(error);
  }
};

/**
 * Tableau de bord administrateur entreprise
 */
exports.getCompanyAdminDashboard = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Aucune entreprise associée à cet utilisateur'
      });
    }

    const totalUsers = await User.count({ where: { companyId } });
    const activeUsers = await User.count({ where: { companyId, status: 'ACTIVE' } });

    const subscription = await CompanySubscription.findOne({
      where: { companyId, status: 'ACTIVE' },
      include: ['plan']
    });

    const unreadMessages = await MessageRecipient.count({
      where: { recipientId: req.user.id, isRead: false, isDeleted: false }
    });

    const upcomingMeetings = await Meeting.count({
      where: {
        companyId,
        startTime: { [Op.gte]: new Date() },
        status: 'SCHEDULED'
      }
    });

    const pendingTasks = await Task.count({
      where: {
        companyId,
        assignedTo: req.user.id,
        status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    const recentUsers = await User.findAll({
      where: { companyId },
      limit: 5,
      order: [['lastActivityAt', 'DESC']],
      attributes: ['id', 'fullName', 'email', 'lastActivityAt', 'status']
    });

    const recentTasks = await Task.findAll({
      where: { companyId },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'assignedToUser', attributes: ['fullName'] }]
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          userLimit: subscription?.userCount || 0,
          unreadMessages,
          upcomingMeetings,
          pendingTasks
        },
        subscription,
        recentUsers,
        recentTasks
      }
    });

  } catch (error) {
    logger.error('Erreur dashboard admin entreprise:', error);
    next(error);
  }
};

/**
 * Tableau de bord utilisateur standard
 */
exports.getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const unreadMessages = await MessageRecipient.count({
      where: { recipientId: userId, isRead: false, isDeleted: false }
    });

    const upcomingMeetings = await Meeting.findAll({
      where: {
        startTime: { [Op.gte]: new Date() },
        status: 'SCHEDULED'
      },
      include: [{
        model: db.MeetingParticipant,
        as: 'participants',
        where: { userId },
        required: true
      }],
      limit: 5,
      order: [['startTime', 'ASC']]
    });

    const myTasks = await Task.findAll({
      where: {
        assignedTo: userId,
        status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] }
      },
      limit: 5,
      order: [['dueDate', 'ASC']]
    });

    const recentNotifications = await db.Notification.findAll({
      where: { userId },
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    const recentDocuments = await Document.findAll({
      where: {
        companyId: req.user.companyId,
        [Op.or]: [
          { uploadedBy: userId },
          { accessLevel: { [Op.in]: ['PUBLIC', 'INTERNAL'] } }
        ]
      },
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      tasksCompleted: await Task.count({ where: { assignedTo: userId, status: 'COMPLETED' } }),
      meetingsAttended: await db.MeetingParticipant.count({ where: { userId, responseStatus: 'ACCEPTED' } }),
      documentsUploaded: await Document.count({ where: { uploadedBy: userId } })
    };

    res.json({
      success: true,
      data: {
        stats: {
          unreadMessages,
          upcomingMeetings: upcomingMeetings.length,
          pendingTasks: myTasks.length,
          tasksCompleted: stats.tasksCompleted,
          meetingsAttended: stats.meetingsAttended,
          documentsUploaded: stats.documentsUploaded
        },
        upcomingMeetings,
        myTasks,
        recentNotifications,
        recentDocuments
      }
    });

  } catch (error) {
    logger.error('Erreur dashboard utilisateur:', error);
    next(error);
  }
};

/**
 * Récupérer les statistiques
 */
exports.getStats = async (req, res, next) => {
  try {
    let stats = {};

    if (req.user.isSystemAdmin) {
      stats = {
        totalCompanies: await Company.count(),
        activeCompanies: await Company.count({ where: { status: 'ACTIVE' } }),
        totalUsers: await User.count(),
        activeUsers: await User.count({ where: { status: 'ACTIVE' } }),
        activeSubscriptions: await CompanySubscription.count({ where: { status: 'ACTIVE' } }),
        monthlyRevenue: await CompanySubscription.sum('totalAmount', { where: { status: 'ACTIVE' } }) || 0
      };
    } else if (req.user.isCompanyAdmin) {
      stats = {
        totalUsers: await User.count({ where: { companyId: req.user.companyId } }),
        activeUsers: await User.count({ where: { companyId: req.user.companyId, status: 'ACTIVE' } }),
        unreadMessages: await MessageRecipient.count({ where: { recipientId: req.user.id, isRead: false } }),
        upcomingMeetings: await Meeting.count({ where: { companyId: req.user.companyId, startTime: { [Op.gte]: new Date() } } }),
        pendingTasks: await Task.count({ where: { companyId: req.user.companyId, status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] } } })
      };
    } else {
      stats = {
        unreadMessages: await MessageRecipient.count({ where: { recipientId: req.user.id, isRead: false } }),
        upcomingMeetings: await Meeting.count({ 
          where: { 
            [Op.or]: [{ organizerId: req.user.id }, { '$participants.userId$': req.user.id }],
            startTime: { [Op.gte]: new Date() } 
          },
          include: [{ model: db.MeetingParticipant, as: 'participants' }]
        }),
        pendingTasks: await Task.count({ where: { assignedTo: req.user.id, status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] } } }),
        documentsUploaded: await Document.count({ where: { uploadedBy: req.user.id } })
      };
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Erreur récupération statistiques:', error);
    next(error);
  }
};

/**
 * Récupérer l'activité récente
 */
exports.getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const where = {};
    if (!req.user.isSystemAdmin) {
      where.companyId = req.user.companyId;
    }

    const activities = await AuditLog.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['fullName'] },
        { model: Company, as: 'company', attributes: ['name'] }
      ],
      order: [['logTimestamp', 'DESC']],
      limit: parseInt(limit)
    });

    const formatted = activities.map(a => ({
      id: a.id,
      description: a.actionDescription,
      user: a.user?.fullName || 'Système',
      company: a.company?.name,
      timestamp: a.logTimestamp,
      actionType: a.actionType
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    logger.error('Erreur récupération activité récente:', error);
    next(error);
  }
};