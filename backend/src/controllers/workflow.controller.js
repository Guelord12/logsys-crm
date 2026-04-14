// backend/src/controllers/workflow.controller.js

const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { createNotification } = require('../services/notification.service');
const { workflowQueue } = require('../queues');

const { Workflow, AutomationLog, Task, User, AuditLog, sequelize } = db;

/**
 * Récupérer les workflows d'une entreprise
 */
exports.getWorkflows = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.params.companyId;
    
    const workflows = await Workflow.findAll({
      where: { companyId, isActive: true },
      order: [['priority', 'ASC'], ['workflowName', 'ASC']]
    });
    
    const stats = await AutomationLog.findAll({
      where: { companyId },
      attributes: [
        'workflowId',
        'result',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['workflowId', 'result']
    });
    
    res.json({
      success: true,
      data: {
        workflows,
        stats
      }
    });
    
  } catch (error) {
    logger.error('Erreur récupération workflows:', error);
    next(error);
  }
};

/**
 * Récupérer les logs d'exécution des workflows
 */
exports.getWorkflowLogs = async (req, res, next) => {
  try {
    const { workflowId, page = 1, limit = 50 } = req.query;
    const companyId = req.user.companyId;
    
    const where = { companyId };
    if (workflowId) where.workflowId = workflowId;
    
    const { count, rows: logs } = await AutomationLog.findAndCountAll({
      where,
      include: [
        { model: Workflow, as: 'workflow', attributes: ['workflowName'] }
      ],
      order: [['createdAt', 'DESC']],
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
    logger.error('Erreur récupération logs workflow:', error);
    next(error);
  }
};

/**
 * Créer un workflow
 */
exports.createWorkflow = async (req, res, next) => {
  try {
    const {
      workflowName,
      description,
      triggerType,
      triggerConfig,
      actions,
      conditions,
      priority
    } = req.body;
    
    const companyId = req.user.companyId || req.body.companyId;
    
    if (!req.user.isSystemAdmin && !req.user.isCompanyAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }
    
    const workflowCode = `WF_${triggerType}_${Date.now()}`;
    
    const workflow = await Workflow.create({
      companyId,
      workflowCode,
      workflowName,
      description,
      triggerType,
      triggerConfig,
      actions,
      conditions: conditions || [],
      priority: priority || 1,
      createdBy: req.user.id
    });
    
    await AuditLog.create({
      userId: req.user.id,
      companyId,
      actionType: 'CREATE',
      entityType: 'WORKFLOW',
      entityId: workflow.id,
      actionDescription: `Création workflow "${workflowName}"`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });
    
    res.status(201).json({
      success: true,
      data: workflow
    });
    
  } catch (error) {
    logger.error('Erreur création workflow:', error);
    next(error);
  }
};

/**
 * Mettre à jour un workflow
 */
exports.updateWorkflow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const workflow = await Workflow.findByPk(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }
    
    if (!req.user.isSystemAdmin && req.user.companyId !== workflow.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    
    await workflow.update(updateData);
    
    res.json({
      success: true,
      data: workflow
    });
    
  } catch (error) {
    logger.error('Erreur mise à jour workflow:', error);
    next(error);
  }
};

/**
 * Supprimer un workflow
 */
exports.deleteWorkflow = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const workflow = await Workflow.findByPk(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }
    
    await workflow.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Workflow supprimé avec succès'
    });
    
  } catch (error) {
    logger.error('Erreur suppression workflow:', error);
    next(error);
  }
};

/**
 * Activer/désactiver un workflow
 */
exports.toggleWorkflow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const workflow = await Workflow.findByPk(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }
    
    await workflow.update({ isActive });
    
    res.json({
      success: true,
      message: `Workflow ${isActive ? 'activé' : 'désactivé'}`,
      data: workflow
    });
    
  } catch (error) {
    logger.error('Erreur toggle workflow:', error);
    next(error);
  }
};

/**
 * Exécuter un workflow manuellement
 */
exports.executeWorkflow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { entityType, entityId } = req.body;
    
    const workflow = await Workflow.findByPk(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }
    
    const job = await workflowQueue.add('execute', {
      workflowId: workflow.id,
      companyId: workflow.companyId,
      triggerType: 'MANUAL',
      entityType,
      entityId,
      triggeredBy: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Workflow mis en file d\'attente',
      data: { jobId: job.id }
    });
    
  } catch (error) {
    logger.error('Erreur exécution workflow:', error);
    next(error);
  }
};

/**
 * Workflow pour la comptabilité - Envoi automatique des écritures
 */
exports.accountingEntryWorkflow = {
  trigger: 'ACCOUNTING_ENTRY_CREATED',
  
  async execute(context) {
    const { entryId, companyId } = context;
    
    try {
      const entry = await db.AccountingEntry.findByPk(entryId, {
        include: ['lines', 'createdBy']
      });
      
      if (!entry) return;
      
      const accountingPosition = await db.JobPosition.findOne({
        where: { code: 'COMPTABLE' }
      });
      
      if (!accountingPosition) return;
      
      const accountants = await db.User.findAll({
        where: {
          companyId,
          jobPositionId: accountingPosition.id,
          status: 'ACTIVE'
        }
      });
      
      if (accountants.length === 0) return;
      
      const assignedUser = accountants[0];
      
      const task = await db.Task.create({
        companyId,
        title: `Vérification écriture ${entry.entryNumber}`,
        description: `Écriture créée par ${entry.createdBy?.fullName || 'Système'} : ${entry.description}`,
        assignedTo: assignedUser.id,
        module: 'accounting',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'PENDING',
        isAutomatic: true
      });
      
      await createNotification({
        userId: assignedUser.id,
        type: 'ACCOUNTING_ENTRY_READY',
        title: 'Nouvelle écriture à vérifier',
        message: `L'écriture ${entry.entryNumber} nécessite votre vérification`,
        priority: 'NORMAL',
        actionUrl: `/accounting/entries/${entry.id}`
      });
      
      logger.info(`Workflow comptabilité: tâche créée pour ${assignedUser.email}`);
      
    } catch (error) {
      logger.error('Erreur workflow comptabilité:', error);
    }
  }
};

/**
 * Workflow pour la logistique - Alerte stock bas
 */
exports.lowStockWorkflow = {
  trigger: 'STOCK_LEVEL_LOW',
  
  async execute(context) {
    const { itemId, warehouseId, companyId, currentLevel, minLevel } = context;
    
    try {
      const logisticPosition = await db.JobPosition.findOne({
        where: { code: 'LOGISTICIAN' }
      });
      
      if (!logisticPosition) return;
      
      const logisticians = await db.User.findAll({
        where: {
          companyId,
          jobPositionId: logisticPosition.id,
          status: 'ACTIVE'
        }
      });
      
      const item = await db.LogisticItem.findByPk(itemId);
      const warehouse = await db.Warehouse.findByPk(warehouseId);
      
      for (const user of logisticians) {
        const task = await db.Task.create({
          companyId,
          title: `Réapprovisionnement urgent : ${item?.itemName}`,
          description: `Stock bas dans l'entrepôt ${warehouse?.warehouseName}. Niveau actuel: ${currentLevel} / Minimum: ${minLevel}`,
          assignedTo: user.id,
          module: 'logistics',
          priority: 'URGENT',
          dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
          status: 'PENDING',
          isAutomatic: true
        });
        
        await createNotification({
          userId: user.id,
          type: 'STOCK_ALERT',
          title: '⚠️ ALERTE STOCK BAS',
          message: `${item?.itemName} est en stock bas. Action requise immédiatement.`,
          priority: 'URGENT',
          actionUrl: `/logistics/inventory/${itemId}`
        });
      }
      
      if (currentLevel <= minLevel * 0.5) {
        const purchaseOrder = await db.PurchaseOrder.create({
          companyId,
          poNumber: `PO_AUTO_${Date.now()}`,
          supplierName: item?.defaultSupplier || 'Fournisseur à déterminer',
          warehouseId,
          orderDate: new Date(),
          status: 'DRAFT',
          notes: 'Commande générée automatiquement - Stock critique',
          isAutomatic: true
        });
        
        logger.info(`Workflow logistique: commande automatique créée ${purchaseOrder.poNumber}`);
      }
      
    } catch (error) {
      logger.error('Erreur workflow stock bas:', error);
    }
  }
};