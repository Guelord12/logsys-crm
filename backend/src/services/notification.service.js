const db = require('../models');
const logger = require('../utils/logger');
const { sendEmail } = require('./email.service');
const { sendSMS } = require('./sms.service');
const { redisPublisher } = require('../config/redis');

const { Notification, NotificationType, User } = db;

/**
 * Créer une notification
 */
const createNotification = async (options) => {
  const {
    userId,
    companyId,
    type,
    title,
    message,
    richContent,
    priority = 'NORMAL',
    actionUrl,
    actionText,
    scheduledFor,
    expiresAt,
    sourceType,
    sourceId,
    channels = ['in_app']
  } = options;

  try {
    // Trouver le type de notification
    let notificationType = await NotificationType.findOne({
      where: { code: type }
    });

    if (!notificationType) {
      notificationType = await NotificationType.findOne({
        where: { code: 'GENERAL' }
      });
    }

    // Créer la notification
    const notification = await Notification.create({
      typeId: notificationType?.id,
      userId,
      companyId,
      title,
      message,
      richContent,
      priority: priority || notificationType?.defaultPriority,
      actionUrl,
      actionText,
      scheduledFor,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      sourceType,
      sourceId,
      status: scheduledFor ? 'UNREAD' : 'UNREAD',
      sentAt: scheduledFor ? null : new Date()
    });

    // Si programmé, ne pas envoyer maintenant
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      return notification;
    }

    // Récupérer l'utilisateur pour les préférences
    const user = await User.findByPk(userId);

    // Envoyer via les canaux demandés
    const channelsUsed = [];

    // In-app (toujours)
    channelsUsed.push('in_app');
    
    // WebSocket pour temps réel
    await redisPublisher.publish('notifications', JSON.stringify({
      type: 'new',
      userId,
      notification: notification.toJSON()
    }));

    // Email
    if (channels.includes('email') && user?.notificationPreferences?.email !== false) {
      try {
        await sendEmail({
          to: user.email,
          subject: `[LogSys] ${title}`,
          template: 'notification',
          data: {
            title,
            message,
            actionUrl,
            actionText,
            fullName: user.fullName
          }
        });
        channelsUsed.push('email');
      } catch (error) {
        logger.error('Erreur envoi email notification:', error);
      }
    }

    // SMS
    if (channels.includes('sms') && user?.notificationPreferences?.sms !== false && user?.phoneNumber) {
      try {
        await sendSMS({
          to: `${user.phoneCountryCode}${user.phoneNumber}`,
          message: `[LogSys] ${title}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`
        });
        channelsUsed.push('sms');
      } catch (error) {
        logger.error('Erreur envoi SMS notification:', error);
      }
    }

    // Mettre à jour les canaux utilisés
    await notification.update({ channelsUsed });

    return notification;

  } catch (error) {
    logger.error('Erreur création notification:', error);
    throw error;
  }
};

/**
 * Envoyer une notification à tous les admins d'une entreprise
 */
const notifyCompanyAdmins = async (companyId, options) => {
  try {
    const admins = await User.findAll({
      where: {
        companyId,
        isCompanyAdmin: true,
        status: 'ACTIVE'
      }
    });

    const notifications = [];
    for (const admin of admins) {
      const notification = await createNotification({
        ...options,
        userId: admin.id,
        companyId
      });
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    logger.error('Erreur notification admins:', error);
    throw error;
  }
};

/**
 * Envoyer une notification à tous les admins système
 */
const notifySystemAdmins = async (options) => {
  try {
    const admins = await User.findAll({
      where: {
        isSystemAdmin: true,
        status: 'ACTIVE'
      }
    });

    const notifications = [];
    for (const admin of admins) {
      const notification = await createNotification({
        ...options,
        userId: admin.id
      });
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    logger.error('Erreur notification admins système:', error);
    throw error;
  }
};

/**
 * Envoyer une notification à plusieurs utilisateurs
 */
const notifyUsers = async (userIds, options) => {
  try {
    const notifications = [];
    for (const userId of userIds) {
      const notification = await createNotification({
        ...options,
        userId
      });
      notifications.push(notification);
    }
    return notifications;
  } catch (error) {
    logger.error('Erreur notification multiple:', error);
    throw error;
  }
};

/**
 * Planifier une notification
 */
const scheduleNotification = async (options, scheduledFor) => {
  return createNotification({
    ...options,
    scheduledFor
  });
};

/**
 * Annuler les notifications planifiées
 */
const cancelScheduledNotifications = async (sourceType, sourceId) => {
  try {
    await Notification.update(
      { status: 'DELETED' },
      {
        where: {
          sourceType,
          sourceId,
          scheduledFor: { [db.Sequelize.Op.ne]: null },
          status: 'UNREAD'
        }
      }
    );
  } catch (error) {
    logger.error('Erreur annulation notifications:', error);
  }
};

module.exports = {
  createNotification,
  notifyCompanyAdmins,
  notifySystemAdmins,
  notifyUsers,
  scheduleNotification,
  cancelScheduledNotifications
};