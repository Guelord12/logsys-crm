const Bull = require('bull');
const { redisBull } = require('../config/redis');
const { sendEmailImmediate } = require('../services/email.service');
const logger = require('../utils/logger');

const emailQueue = new Bull('email', {
  redis: redisBull.options,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

emailQueue.process(async (job) => {
  logger.info(`Traitement email ${job.id}: ${job.data.subject}`);
  
  try {
    await sendEmailImmediate(job.data);
    logger.info(`Email envoyé: ${job.id}`);
    return { success: true };
  } catch (error) {
    logger.error(`Erreur email ${job.id}:`, error);
    throw error;
  }
});

emailQueue.on('completed', (job) => {
  logger.debug(`Email ${job.id} complété`);
});

emailQueue.on('failed', (job, error) => {
  logger.error(`Email ${job.id} échoué après ${job.attemptsMade} tentatives:`, error);
});

module.exports = emailQueue;