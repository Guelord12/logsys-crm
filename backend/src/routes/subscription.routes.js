const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Routes accessibles
router.get('/plans', subscriptionController.getPlans);
router.get('/company/:companyId', subscriptionController.getCompanySubscription);
router.get('/company/:companyId/history', subscriptionController.getSubscriptionHistory);
router.get('/company/:companyId/upcoming-invoice', subscriptionController.getUpcomingInvoice);

// Routes admin système uniquement
router.post('/', authorize('SYSTEM_ADMIN'), subscriptionController.createSubscription);
router.put('/company/:companyId', authorize('SYSTEM_ADMIN'), subscriptionController.updateSubscription);
router.post('/company/:companyId/cancel', subscriptionController.cancelSubscription);
router.post('/company/:companyId/reactivate', authorize('SYSTEM_ADMIN'), subscriptionController.reactivateSubscription);
router.get('/expiring', authorize('SYSTEM_ADMIN'), subscriptionController.getExpiringSubscriptions);
router.get('/stats', authorize('SYSTEM_ADMIN'), subscriptionController.getSubscriptionStats);

module.exports = router;