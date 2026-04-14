const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { Parser } = require('json2csv');

const { AuditLog, Company, User, AccountingEntry, CustomerInvoice } = db;

/**
 * Générer un rapport d'audit
 */
exports.generateAuditReport = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      companyId,
      userId,
      actionType,
      format = 'json'
    } = req.query;

    if (!req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs système'
      });
    }

    const where = {};

    if (startDate && endDate) {
      where.logTimestamp = { [Op.between]: [startDate, endDate] };
    }
    if (companyId) where.companyId = companyId;
    if (userId) where.userId = userId;
    if (actionType) where.actionType = actionType;

    const logs = await AuditLog.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['email', 'fullName'] },
        { model: Company, as: 'company', attributes: ['name'] }
      ],
      order: [['logTimestamp', 'DESC']],
      limit: 10000
    });

    if (format === 'csv') {
      const fields = ['logTimestamp', 'user.email', 'user.fullName', 'company.name', 
                      'actionType', 'entityType', 'entityName', 'actionDescription', 
                      'status', 'ipAddress'];
      const parser = new Parser({ fields });
      const csv = parser.parse(logs.map(log => ({
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
      res.attachment(`audit_report_${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    logger.error('Erreur génération rapport audit:', error);
    next(error);
  }
};

/**
 * Rapport d'activité utilisateur
 */
exports.getUserActivityReport = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.logTimestamp = { [Op.between]: [startDate, endDate] };
    }

    const stats = {
      totalLogins: await AuditLog.count({ where: { ...where, actionType: 'LOGIN' } }),
      totalActions: await AuditLog.count({ where }),
      actionsByType: await AuditLog.findAll({
        attributes: ['actionType', [Sequelize.fn('COUNT', '*'), 'count']],
        where,
        group: ['actionType']
      }),
      actionsByDay: await AuditLog.findAll({
        attributes: [
          [Sequelize.fn('DATE', Sequelize.col('log_timestamp')), 'date'],
          [Sequelize.fn('COUNT', '*'), 'count']
        ],
        where,
        group: [Sequelize.fn('DATE', Sequelize.col('log_timestamp'))],
        order: [[Sequelize.fn('DATE', Sequelize.col('log_timestamp')), 'ASC']]
      })
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Erreur rapport activité utilisateur:', error);
    next(error);
  }
};

/**
 * Rapport d'entreprise
 */
exports.getCompanyReport = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!req.user.isSystemAdmin && req.user.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const company = await Company.findByPk(companyId, {
      include: ['activeSubscription', 'users']
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Entreprise non trouvée'
      });
    }

    const stats = {
      totalUsers: company.users?.length || 0,
      activeUsers: company.users?.filter(u => u.status === 'ACTIVE').length || 0,
      subscription: company.activeSubscription,
      recentActivity: await AuditLog.findAll({
        where: { companyId },
        limit: 50,
        order: [['logTimestamp', 'DESC']]
      })
    };

    res.json({
      success: true,
      data: {
        company,
        stats
      }
    });

  } catch (error) {
    logger.error('Erreur rapport entreprise:', error);
    next(error);
  }
};

/**
 * Export des données
 */
exports.exportData = async (req, res, next) => {
  try {
    const { entity, format = 'csv', filters } = req.query;

    let data;
    let filename;

    switch (entity) {
      case 'users':
        data = await User.findAll({
          where: filters ? JSON.parse(filters) : {},
          include: ['company'],
          attributes: { exclude: ['passwordHash'] }
        });
        filename = 'users_export';
        break;

      case 'companies':
        data = await Company.findAll({
          where: filters ? JSON.parse(filters) : {},
          include: ['activeSubscription']
        });
        filename = 'companies_export';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Type d\'entité non supporté'
        });
    }

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(data.map(d => d.toJSON()));
      
      res.header('Content-Type', 'text/csv');
      res.attachment(`${filename}_${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    logger.error('Erreur export données:', error);
    next(error);
  }
};