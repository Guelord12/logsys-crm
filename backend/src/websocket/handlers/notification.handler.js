const logger = require('../../utils/logger');

const handleSubscribe = (io, socket, data) => {
  socket.join(`notifications:${socket.user.id}`);
  logger.debug(`Utilisateur ${socket.user.id} abonné aux notifications`);
};

const handleUnsubscribe = (io, socket, data) => {
  socket.leave(`notifications:${socket.user.id}`);
  logger.debug(`Utilisateur ${socket.user.id} désabonné des notifications`);
};

const handleMarkAsRead = async (io, socket, data) => {
  const { notificationIds } = data;
  
  try {
    const db = require('../../models');
    await db.Notification.update(
      { status: 'READ', readAt: new Date() },
      { where: { id: notificationIds, userId: socket.user.id } }
    );
  } catch (error) {
    logger.error('Erreur marquage notification:', error);
  }
};

module.exports = {
  handleSubscribe,
  handleUnsubscribe,
  handleMarkAsRead
};