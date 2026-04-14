const Bull = require('bull');
const { redisBull } = require('../config/redis');
const { createNotification } = require('../services/notification.service');
const logger = require('../utils/logger');

const notificationQueue = new Bull('notification', {
  redis: redisBull.options,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000
    },
    removeOnComplete: true
  }
});

notificationQueue.process(async (job) => {
  logger.info(`Traitement notification ${job.id}`);
  
  try {
    await createNotification(job.data);
    logger.info(`Notification créée: ${job.id}`);
    return { success: true };
  } catch (error) {
    logger.error(`Erreur notification ${job.id}:`, error);
    throw error;
  }
});

notificationQueue.on('failed', (job, error) => {
  logger.error(`Notification ${job.id} échouée:`, error);
});

module.exports = notificationQueue;