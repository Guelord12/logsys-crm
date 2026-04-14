const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('SYSTEM_ADMIN'), auditController.getAuditLogs);
router.get('/stats', authorize('SYSTEM_ADMIN'), auditController.getAuditStats);
router.get('/export', authorize('SYSTEM_ADMIN'), auditController.exportAuditLogs);
router.get('/company/:companyId', auditController.getCompanyAuditLogs);
router.get('/user/:userId', auditController.getUserActivity);

module.exports = router;