const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications
 */

// Notifications
router.get('/', notificationController.getNotifications);
router.get('/unread/count', notificationController.getUnreadCount);
router.post('/mark-read', notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/', notificationController.deleteAllNotifications);
router.post('/:id/archive', notificationController.archiveNotification);

// Préférences
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

module.exports = router;