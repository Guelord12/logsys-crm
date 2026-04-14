const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { Parser } = require('json2csv');

const { AuditLog, User, Company } = db;

/**
 * Récupérer les logs d'audit
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      companyId,
      actionType,
      entityType,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    // Vérifier les permissions
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs système'
      });
    }

    const where = {};

    if (userId) where.userId = userId;
    if (companyId) where.companyId = companyId;
    if (actionType) where.actionType = actionType;
    if (entityType) where.entityType = entityType;
    if (status) where.status = status;
    
    if (startDate && endDate) {
      where.logTimestamp = { [Op.between]: [startDate, endDate] };
    }

    if (search) {
      where[Op.or] = [
        { entityName: { [Op.iLike]: `%${search}%` } },
        { actionDescription: { [Op.iLike]: `%${search}%` } },
        { userEmail: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'fullName']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name']
        }
      ],
      order: [['logTimestamp', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération logs audit:', error);
    next(error);
  }
};

/**
 * Récupérer les statistiques d'audit
 */
exports.getAuditStats = async (req, res, next) => {
  try {
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs système'
      });
    }

    const totalLogs = await AuditLog.count();

    const logsByAction = await AuditLog.findAll({
      attributes: [
        'actionType',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['actionType'],
      raw: true
    });

    const logsByEntity = await AuditLog.findAll({
      attributes: [
        'entityType',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['entityType'],
      limit: 10,
      raw: true
    });

    const logsByDay = await AuditLog.findAll({
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('log_timestamp')), 'date'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: {
        logTimestamp: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      group: [db.sequelize.fn('DATE', db.sequelize.col('log_timestamp'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('log_timestamp')), 'ASC']],
      raw: true
    });

    const topUsers = await AuditLog.findAll({
      attributes: [
        'userId',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: ['email', 'fullName']
      }],
      group: ['userId', 'user.id', 'user.email', 'user.fullName'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: false
    });

    res.json({
      success: true,
      data: {
        totalLogs,
        logsByAction,
        logsByEntity,
        logsByDay,
        topUsers: topUsers.map(u => ({
          userId: u.userId,
          email: u.user?.email,
          fullName: u.user?.fullName,
          count: u.dataValues.count
        }))
      }
    });

  } catch (error) {
    logger.error('Erreur récupération stats audit:', error);
    next(error);
  }
};

/**
 * Récupérer les logs d'une entreprise spécifique
 */
exports.getCompanyAuditLogs = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const {
      page = 1,
      limit = 50,
      actionType,
      startDate,
      endDate
    } = req.query;

    // Vérifier les permissions
    const canAccess = req.user.isSystemAdmin || 
      (req.user.isCompanyAdmin && req.user.companyId === companyId);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const where = { companyId };

    if (actionType) where.actionType = actionType;
    if (startDate && endDate) {
      where.logTimestamp = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'fullName']
      }],
      order: [['logTimestamp', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération logs entreprise:', error);
    next(error);
  }
};

/**
 * Exporter les logs d'audit
 */
exports.exportAuditLogs = async (req, res, next) => {
  try {
    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs système'
      });
    }

    const {
      format = 'csv',
      startDate,
      endDate,
      actionType,
      companyId
    } = req.query;

    const where = {};

    if (startDate && endDate) {
      where.logTimestamp = { [Op.between]: [startDate, endDate] };
    }
    if (actionType) where.actionType = actionType;
    if (companyId) where.companyId = companyId;

    const logs = await AuditLog.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'fullName']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['name']
        }
      ],
      order: [['logTimestamp', 'DESC']],
      limit: 10000
    });

    if (format === 'csv') {
      const fields = [
        'logTimestamp',
        'user.email',
        'user.fullName',
        'company.name',
        'actionType',
        'entityType',
        'entityName',
        'actionDescription',
        'status',
        'ipAddress'
      ];
      
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(logs.map(log => ({
        logTimestamp: log.logTimestamp,
        'user.email': log.user?.email,
        'user.fullName': log.user?.fullName,
        'company.name': log.company?.name,
        actionType: log.actionType,
        entityType: log.entityType,
        entityName: log.entityName,
        actionDescription: log.actionDescription,
        status: log.status,
        ipAddress: log.ipAddress
      })));

      res.header('Content-Type', 'text/csv');
      res.attachment(`audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    logger.error('Erreur export logs audit:', error);
    next(error);
  }
};

/**
 * Récupérer l'activité des utilisateurs
 */
exports.getUserActivity = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!req.user.isSystemAdmin && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const logs = await AuditLog.findAll({
      where: { userId },
      include: [{
        model: Company,
        as: 'company',
        attributes: ['name']
      }],
      order: [['logTimestamp', 'DESC']],
      limit: 100
    });

    const stats = {
      totalActions: await AuditLog.count({ where: { userId } }),
      loginCount: await AuditLog.count({ where: { userId, actionType: 'LOGIN' } }),
      lastLogin: await AuditLog.findOne({
        where: { userId, actionType: 'LOGIN', status: 'SUCCESS' },
        order: [['logTimestamp', 'DESC']]
      }),
      actionsByType: await AuditLog.findAll({
        attributes: [
          'actionType',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        where: { userId },
        group: ['actionType'],
        raw: true
      })
    };

    res.json({
      success: true,
      data: {
        logs,
        stats
      }
    });

  } catch (error) {
    logger.error('Erreur récupération activité utilisateur:', error);
    next(error);
  }
};