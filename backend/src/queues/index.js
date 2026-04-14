const Bull = require('bull');
const { redisBull } = require('../config/redis');
const logger = require('../utils/logger');
const { sendEmailImmediate } = require('../services/email.service');
const { sendSMSImmediate } = require('../services/sms.service');
const { createNotification } = require('../services/notification.service');

// Créer les queues
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

const smsQueue = new Bull('sms', {
  redis: redisBull.options,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true
  }
});

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

const reportQueue = new Bull('report', {
  redis: redisBull.options,
  defaultJobOptions: {
    attempts: 2,
    timeout: 300000, // 5 minutes
    removeOnComplete: true
  }
});

const auditQueue = new Bull('audit', {
  redis: redisBull.options,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Processeurs

// Email
emailQueue.process(async (job) => {
  logger.info(`Traitement email: ${job.id}`);
  
  try {
    await sendEmailImmediate(job.data);
    logger.info(`Email envoyé: ${job.id}`);
    return { success: true };
  } catch (error) {
    logger.error(`Erreur envoi email ${job.id}:`, error);
    throw error;
  }
});

// SMS
smsQueue.process(async (job) => {
  logger.info(`Traitement SMS: ${job.id}`);
  
  try {
    await sendSMSImmediate(job.data.to, job.data.message);
    logger.info(`SMS envoyé: ${job.id}`);
    return { success: true };
  } catch (error) {
    logger.error(`Erreur envoi SMS ${job.id}:`, error);
    throw error;
  }
});

// Notification
notificationQueue.process(async (job) => {
  logger.info(`Traitement notification: ${job.id}`);
  
  try {
    await createNotification(job.data);
    logger.info(`Notification créée: ${job.id}`);
    return { success: true };
  } catch (error) {
    logger.error(`Erreur création notification ${job.id}:`, error);
    throw error;
  }
});

// Rapport
reportQueue.process(async (job) => {
  logger.info(`Génération rapport: ${job.id}`);
  
  const { type, data, options } = job.data;
  
  try {
    const { generateReportPDF } = require('../services/pdf.service');
    const result = await generateReportPDF(type, data, options);
    logger.info(`Rapport généré: ${job.id}`);
    return { success: true, path: result };
  } catch (error) {
    logger.error(`Erreur génération rapport ${job.id}:`, error);
    throw error;
  }
});

// Audit
auditQueue.process(async (job) => {
  const { AuditLog } = require('../models');
  
  try {
    await AuditLog.create(job.data);
    return { success: true };
  } catch (error) {
    logger.error('Erreur création log audit:', error);
    throw error;
  }
});

// Événements
emailQueue.on('completed', (job) => {
  logger.debug(`Email job ${job.id} complété`);
});

emailQueue.on('failed', (job, error) => {
  logger.error(`Email job ${job.id} échoué:`, error);
});

smsQueue.on('failed', (job, error) => {
  logger.error(`SMS job ${job.id} échoué:`, error);
});

// Nettoyage périodique
const cleanOldJobs = async () => {
  try {
    await emailQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await smsQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await notificationQueue.clean(7 * 24 * 60 * 60 * 1000, 'completed');
    await reportQueue.clean(30 * 24 * 60 * 60 * 1000, 'completed');
    logger.info('Nettoyage des jobs anciens effectué');
  } catch (error) {
    logger.error('Erreur nettoyage jobs:', error);
  }
};

// Exécuter le nettoyage chaque jour
setInterval(cleanOldJobs, 24 * 60 * 60 * 1000);

// Configuration du dashboard Bull
const setupBullBoard = (app) => {
  const { createBullBoard } = require('bull-board');
  const { BullAdapter } = require('bull-board/bullAdapter');
  
  const { router } = createBullBoard([
    new BullAdapter(emailQueue),
    new BullAdapter(smsQueue),
    new BullAdapter(notificationQueue),
    new BullAdapter(reportQueue),
    new BullAdapter(auditQueue)
  ]);
  
  app.use('/admin/queues', router);
  
  logger.info('✅ Bull Board configuré sur /admin/queues');
};

module.exports = {
  emailQueue,
  smsQueue,
  notificationQueue,
  reportQueue,
  auditQueue,
  setupBullBoard
};