const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { createNotification } = require('../services/notification.service');

const { Task, TaskComment, TaskType, User, AuditLog } = db;

/**
 * Récupérer les tâches
 */
exports.getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      assignedTo,
      search,
      sortBy = 'dueDate',
      sortOrder = 'ASC'
    } = req.query;

    const where = { companyId: req.user.companyId };

    if (!req.user.isSystemAdmin && !req.user.isCompanyAdmin) {
      where.assignedTo = req.user.id;
    } else if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { taskCode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [
        { model: User, as: 'assignedToUser', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'assignedByUser', attributes: ['id', 'fullName'] },
        { model: TaskType, as: 'taskType' }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération tâches:', error);
    next(error);
  }
};

/**
 * Récupérer une tâche
 */
exports.getTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, companyId: req.user.companyId },
      include: [
        { model: User, as: 'assignedToUser' },
        { model: User, as: 'assignedByUser' },
        { model: TaskType, as: 'taskType' },
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'user' }] },
        { model: Task, as: 'subtasks' }
      ]
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }

    res.json({ success: true, data: task });

  } catch (error) {
    logger.error('Erreur récupération tâche:', error);
    next(error);
  }
};

/**
 * Créer une tâche
 */
exports.createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      taskTypeId,
      assignedTo,
      startDate,
      dueDate,
      estimatedHours,
      priority,
      parentTaskId,
      tags
    } = req.body;

    const task = await Task.create({
      companyId: req.user.companyId,
      title,
      description,
      taskTypeId,
      assignedTo,
      assignedBy: req.user.id,
      startDate,
      dueDate,
      estimatedHours,
      priority: priority || 'MEDIUM',
      parentTaskId,
      tags,
      createdBy: req.user.id
    });

    await task.update({ taskCode: `TSK${task.id.slice(0, 8).toUpperCase()}` });

    if (assignedTo && assignedTo !== req.user.id) {
      await createNotification({
        userId: assignedTo,
        type: 'TASK_ASSIGNED',
        title: 'Nouvelle tâche assignée',
        message: `${req.user.fullName} vous a assigné la tâche "${title}"`,
        priority: priority === 'URGENT' ? 'HIGH' : 'NORMAL',
        actionUrl: `/tasks/${task.id}`
      });
    }

    res.status(201).json({ success: true, data: task });

  } catch (error) {
    logger.error('Erreur création tâche:', error);
    next(error);
  }
};

/**
 * Mettre à jour une tâche
 */
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const task = await Task.findOne({
      where: { id, companyId: req.user.companyId }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }

    const oldAssignedTo = task.assignedTo;
    await task.update(updateData);

    if (updateData.assignedTo && updateData.assignedTo !== oldAssignedTo) {
      await createNotification({
        userId: updateData.assignedTo,
        type: 'TASK_ASSIGNED',
        title: 'Tâche réassignée',
        message: `${req.user.fullName} vous a assigné la tâche "${task.title}"`,
        actionUrl: `/tasks/${task.id}`
      });
    }

    if (updateData.status === 'COMPLETED' && task.status !== 'COMPLETED') {
      await task.update({
        completedAt: new Date(),
        completedBy: req.user.id,
        completionPercentage: 100
      });
    }

    res.json({ success: true, data: task });

  } catch (error) {
    logger.error('Erreur mise à jour tâche:', error);
    next(error);
  }
};

/**
 * Supprimer une tâche
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, companyId: req.user.companyId }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }

    await task.destroy();

    res.json({ success: true, message: 'Tâche supprimée avec succès' });

  } catch (error) {
    logger.error('Erreur suppression tâche:', error);
    next(error);
  }
};

/**
 * Mettre à jour le statut d'une tâche
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findOne({
      where: { id, companyId: req.user.companyId }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }

    const updates = { status };
    if (status === 'COMPLETED') {
      updates.completedAt = new Date();
      updates.completedBy = req.user.id;
      updates.completionPercentage = 100;
    }

    await task.update(updates);

    res.json({ success: true, data: task });

  } catch (error) {
    logger.error('Erreur mise à jour statut tâche:', error);
    next(error);
  }
};

/**
 * Assigner une tâche
 */
exports.assignTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const task = await Task.findOne({
      where: { id, companyId: req.user.companyId }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }

    await task.update({ assignedTo: userId, assignedBy: req.user.id });

    if (userId && userId !== req.user.id) {
      await createNotification({
        userId,
        type: 'TASK_ASSIGNED',
        title: 'Tâche assignée',
        message: `${req.user.fullName} vous a assigné la tâche "${task.title}"`,
        actionUrl: `/tasks/${task.id}`
      });
    }

    res.json({ success: true, data: task });

  } catch (error) {
    logger.error('Erreur assignation tâche:', error);
    next(error);
  }
};

/**
 * Ajouter un commentaire
 */
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }

    const taskComment = await TaskComment.create({
      taskId: id,
      userId: req.user.id,
      commentText: comment
    });

    if (task.assignedTo && task.assignedTo !== req.user.id) {
      await createNotification({
        userId: task.assignedTo,
        type: 'TASK_COMMENT',
        title: 'Nouveau commentaire',
        message: `${req.user.fullName} a commenté la tâche "${task.title}"`,
        actionUrl: `/tasks/${id}`
      });
    }

    res.status(201).json({ success: true, data: taskComment });

  } catch (error) {
    logger.error('Erreur ajout commentaire:', error);
    next(error);
  }
};

/**
 * Récupérer les commentaires d'une tâche
 */
exports.getComments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comments = await TaskComment.findAll({
      where: { taskId: id },
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'ASC']]
    });

    res.json({ success: true, data: comments });

  } catch (error) {
    logger.error('Erreur récupération commentaires:', error);
    next(error);
  }
};

/**
 * Récupérer mes tâches
 */
exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.findAll({
      where: {
        assignedTo: req.user.id,
        status: { [Op.in]: ['PENDING', 'IN_PROGRESS'] }
      },
      order: [['priority', 'ASC'], ['dueDate', 'ASC']]
    });

    res.json({ success: true, data: tasks });

  } catch (error) {
    logger.error('Erreur récupération mes tâches:', error);
    next(error);
  }
};

/**
 * Statistiques des tâches
 */
exports.getTaskStats = async (req, res, next) => {
  try {
    const where = { companyId: req.user.companyId };
    
    if (!req.user.isSystemAdmin && !req.user.isCompanyAdmin) {
      where.assignedTo = req.user.id;
    }

    const stats = {
      total: await Task.count({ where }),
      byStatus: await Task.findAll({
        attributes: ['status', [Sequelize.fn('COUNT', '*'), 'count']],
        where,
        group: ['status']
      }),
      byPriority: await Task.findAll({
        attributes: ['priority', [Sequelize.fn('COUNT', '*'), 'count']],
        where,
        group: ['priority']
      }),
      overdue: await Task.count({
        where: {
          ...where,
          dueDate: { [Op.lt]: new Date() },
          status: { [Op.notIn]: ['COMPLETED', 'CANCELLED'] }
        }
      }),
      completedThisWeek: await Task.count({
        where: {
          ...where,
          status: 'COMPLETED',
          completedAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    };

    res.json({ success: true, data: stats });

  } catch (error) {
    logger.error('Erreur stats tâches:', error);
    next(error);
  }
};