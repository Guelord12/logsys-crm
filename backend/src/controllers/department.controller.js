// backend/src/controllers/department.controller.js

const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { createNotification } = require('../services/notification.service');

const { Department, JobPosition, User, Company, AuditLog, sequelize } = db;

/**
 * Récupérer tous les départements
 */
exports.getDepartments = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.query.companyId;
    
    const departments = await Department.findAll({
      where: { companyId, isActive: true },
      include: [
        {
          model: Department,
          as: 'parent',
          attributes: ['id', 'departmentName']
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['hierarchyLevel', 'ASC'], ['departmentName', 'ASC']]
    });
    
    res.json({
      success: true,
      data: departments
    });
    
  } catch (error) {
    logger.error('Erreur récupération départements:', error);
    next(error);
  }
};

/**
 * Récupérer un département par ID
 */
exports.getDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'parent',
          attributes: ['id', 'departmentName']
        },
        {
          model: Department,
          as: 'children',
          attributes: ['id', 'departmentName']
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'employees',
          attributes: ['id', 'fullName', 'email', 'jobPositionId']
        }
      ]
    });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Département non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: department
    });
    
  } catch (error) {
    logger.error('Erreur récupération département:', error);
    next(error);
  }
};

/**
 * Récupérer les statistiques des départements
 */
exports.getDepartmentStats = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.query.companyId;
    
    const stats = await sequelize.query(`
      SELECT 
        d.id,
        d.department_name,
        COUNT(DISTINCT u.id) as total_employees,
        COUNT(DISTINCT t.id) as active_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'COMPLETED') as completed_tasks
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id AND u.status = 'ACTIVE' AND u.deleted_at IS NULL
      LEFT JOIN tasks t ON t.assigned_to = u.id AND t.status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
      WHERE d.company_id = :companyId AND d.is_active = true
      GROUP BY d.id, d.department_name
    `, {
      replacements: { companyId },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Erreur statistiques départements:', error);
    next(error);
  }
};

/**
 * Récupérer l'organigramme complet de l'entreprise
 */
exports.getOrganizationChart = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.params.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'entreprise requis'
      });
    }
    
    if (!req.user.isSystemAdmin && req.user.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    
    const [result] = await sequelize.query(
      'SELECT generate_organization_chart(:companyId) as chart',
      {
        replacements: { companyId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    const departments = await Department.findAll({
      where: { companyId, isActive: true },
      include: [
        {
          model: Department,
          as: 'parent',
          attributes: ['id', 'departmentName']
        },
        {
          model: Department,
          as: 'children',
          attributes: ['id', 'departmentName']
        },
        {
          model: JobPosition,
          as: 'managerPosition',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['hierarchyLevel', 'ASC'], ['departmentName', 'ASC']]
    });
    
    const departmentStats = await sequelize.query(`
      SELECT 
        d.id,
        d.department_name,
        COUNT(DISTINCT u.id) as total_employees,
        COUNT(DISTINCT t.id) as active_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'COMPLETED') as completed_tasks,
        AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at))/3600) as avg_task_completion_hours
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id AND u.status = 'ACTIVE' AND u.deleted_at IS NULL
      LEFT JOIN tasks t ON t.assigned_to = u.id AND t.status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
      WHERE d.company_id = :companyId AND d.is_active = true
      GROUP BY d.id, d.department_name
    `, {
      replacements: { companyId },
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: {
        chart: result?.chart || [],
        departments,
        stats: departmentStats
      }
    });
    
  } catch (error) {
    logger.error('Erreur récupération organigramme:', error);
    next(error);
  }
};

/**
 * Créer un département
 */
exports.createDepartment = async (req, res, next) => {
  try {
    const {
      departmentName,
      departmentCode,
      description,
      parentDepartmentId,
      managerPositionId,
      hierarchyLevel,
      icon,
      color
    } = req.body;
    
    const companyId = req.user.companyId || req.body.companyId;
    
    if (!req.user.isSystemAdmin && !req.user.isCompanyAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }
    
    const existing = await Department.findOne({
      where: { companyId, departmentCode }
    });
    
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Un département avec ce code existe déjà'
      });
    }
    
    const department = await Department.create({
      companyId,
      departmentCode,
      departmentName,
      description,
      parentDepartmentId,
      managerPositionId,
      hierarchyLevel: hierarchyLevel || 1,
      icon,
      color
    });
    
    await updateCompanyOrganizationChart(companyId);
    
    await AuditLog.create({
      userId: req.user.id,
      companyId,
      actionType: 'CREATE',
      entityType: 'DEPARTMENT',
      entityId: department.id,
      entityName: department.departmentName,
      actionDescription: `Création du département ${department.departmentName}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });
    
    res.status(201).json({
      success: true,
      data: department
    });
    
  } catch (error) {
    logger.error('Erreur création département:', error);
    next(error);
  }
};

/**
 * Mettre à jour un département
 */
exports.updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const department = await Department.findByPk(id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Département non trouvé'
      });
    }
    
    if (!req.user.isSystemAdmin && req.user.companyId !== department.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    
    await department.update(updateData);
    
    await updateCompanyOrganizationChart(department.companyId);
    
    res.json({
      success: true,
      data: department
    });
    
  } catch (error) {
    logger.error('Erreur mise à jour département:', error);
    next(error);
  }
};

/**
 * Supprimer un département
 */
exports.deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Département non trouvé'
      });
    }
    
    const employeeCount = await User.count({
      where: { departmentId: id, status: 'ACTIVE' }
    });
    
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer : ${employeeCount} employé(s) dans ce département`
      });
    }
    
    const childCount = await Department.count({
      where: { parentDepartmentId: id }
    });
    
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer : ${childCount} sous-département(s)`
      });
    }
    
    await department.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Département supprimé avec succès'
    });
    
  } catch (error) {
    logger.error('Erreur suppression département:', error);
    next(error);
  }
};

/**
 * Assigner un manager à un département
 */
exports.assignDepartmentManager = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { userId } = req.body;
    
    const department = await Department.findByPk(departmentId);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Département non trouvé'
      });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    await user.update({ departmentId });
    await department.update({ managerPositionId: user.jobPositionId });
    
    await createNotification({
      userId: user.id,
      type: 'DEPARTMENT_MANAGER_ASSIGNED',
      title: 'Nouvelle assignation',
      message: `Vous avez été désigné comme manager du département ${department.departmentName}`,
      priority: 'HIGH'
    });
    
    res.json({
      success: true,
      message: 'Manager assigné avec succès'
    });
    
  } catch (error) {
    logger.error('Erreur assignation manager:', error);
    next(error);
  }
};

// Fonction helper pour mettre à jour l'organigramme
async function updateCompanyOrganizationChart(companyId) {
  try {
    const [result] = await sequelize.query(
      'SELECT generate_organization_chart(:companyId) as chart',
      {
        replacements: { companyId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    await Company.update(
      { organizationChart: result?.chart || {} },
      { where: { id: companyId } }
    );
    
  } catch (error) {
    logger.error('Erreur mise à jour organigramme:', error);
  }
}