const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');

const { Notification, NotificationType } = db;

/**
 * Récupérer les notifications de l'utilisateur
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      type
    } = req.query;

    const where = { userId: req.user.id };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.typeId = type;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      include: [{
        model: NotificationType,
        as: 'type',
        attributes: ['id', 'code', 'name']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, status: 'UNREAD' }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération notifications:', error);
    next(error);
  }
};

/**
 * Récupérer le nombre de notifications non lues
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, status: 'UNREAD' }
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    logger.error('Erreur récupération compteur non lus:', error);
    next(error);
  }
};

/**
 * Marquer des notifications comme lues
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || notificationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune notification spécifiée' });
    }

    await Notification.update(
      { status: 'READ', readAt: new Date() },
      { where: { id: notificationIds, userId: req.user.id } }
    );

    res.json({ success: true, message: `${notificationIds.length} notification(s) marquée(s) comme lue(s)` });
  } catch (error) {
    logger.error('Erreur marquage notifications:', error);
    next(error);
  }
};

/**
 * Marquer toutes les notifications comme lues
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.update(
      { status: 'READ', readAt: new Date() },
      { where: { userId: req.user.id, status: 'UNREAD' } }
    );

    res.json({ success: true, message: `${result[0]} notification(s) marquée(s) comme lue(s)` });
  } catch (error) {
    logger.error('Erreur marquage toutes notifications:', error);
    next(error);
  }
};

/**
 * Supprimer une notification
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée' });
    }

    await notification.destroy();
    res.json({ success: true, message: 'Notification supprimée' });
  } catch (error) {
    logger.error('Erreur suppression notification:', error);
    next(error);
  }
};

/**
 * Supprimer toutes les notifications
 */
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    const result = await Notification.destroy({
      where: { userId: req.user.id }
    });

    res.json({ success: true, message: `${result} notification(s) supprimée(s)` });
  } catch (error) {
    logger.error('Erreur suppression toutes notifications:', error);
    next(error);
  }
};

/**
 * Archiver une notification
 */
exports.archiveNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée' });
    }

    await notification.update({ status: 'ARCHIVED' });
    res.json({ success: true, message: 'Notification archivée' });
  } catch (error) {
    logger.error('Erreur archivage notification:', error);
    next(error);
  }
};

/**
 * Récupérer les préférences de notification
 */
exports.getPreferences = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user.notificationPreferences || { email: true, sms: true, push: true }
    });
  } catch (error) {
    logger.error('Erreur récupération préférences:', error);
    next(error);
  }
};

/**
 * Mettre à jour les préférences de notification
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const { email, sms, push } = req.body;

    await req.user.update({
      notificationPreferences: { email, sms, push }
    });

    res.json({ success: true, message: 'Préférences mises à jour', data: { email, sms, push } });
  } catch (error) {
    logger.error('Erreur mise à jour préférences:', error);
    next(error);
  }
};