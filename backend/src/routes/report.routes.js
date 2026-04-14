const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/audit', authorize('SYSTEM_ADMIN'), reportController.generateAuditReport);
router.get('/user-activity/:userId?', reportController.getUserActivityReport);
router.get('/company/:companyId', reportController.getCompanyReport);
router.get('/export', reportController.exportData);

module.exports = router;