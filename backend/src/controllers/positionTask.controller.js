const db = require('../models');
const logger = require('../utils/logger');

/**
 * Récupérer les templates de tâches
 */
exports.getTemplates = async (req, res, next) => {
  try {
    const templates = await db.TaskTemplate.findAll();
    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('Erreur récupération templates:', error);
    next(error);
  }
};

/**
 * Récupérer les tâches d'un poste
 */
exports.getPositionTasks = async (req, res, next) => {
  try {
    const { positionId } = req.params;
    const tasks = await db.PositionTask.findAll({
      where: { jobPositionId: positionId, isActive: true }
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    logger.error('Erreur récupération tâches poste:', error);
    next(error);
  }
};

/**
 * Créer une tâche pour un poste
 */
exports.createPositionTask = async (req, res, next) => {
  try {
    const task = await db.PositionTask.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    logger.error('Erreur création tâche poste:', error);
    next(error);
  }
};

/**
 * Mettre à jour une tâche de poste
 */
exports.updatePositionTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await db.PositionTask.findByPk(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }
    await task.update(req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    logger.error('Erreur mise à jour tâche poste:', error);
    next(error);
  }
};

/**
 * Supprimer une tâche de poste
 */
exports.deletePositionTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await db.PositionTask.findByPk(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }
    await task.update({ isActive: false });
    res.json({ success: true, message: 'Tâche supprimée' });
  } catch (error) {
    logger.error('Erreur suppression tâche poste:', error);
    next(error);
  }
};

/**
 * Générer les tâches pour un utilisateur
 */
exports.generateUserTasks = async (req, res, next) => {
  try {
    const { userId } = req.params;
    // Logique de génération à implémenter
    res.json({ success: true, message: 'Tâches générées', data: { taskCount: 0 } });
  } catch (error) {
    logger.error('Erreur génération tâches:', error);
    next(error);
  }
};