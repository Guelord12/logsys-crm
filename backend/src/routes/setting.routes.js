const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', settingController.getSettings);
router.get('/public', settingController.getPublicSettings);
router.put('/:key', authorize('SYSTEM_ADMIN'), settingController.updateSetting);
router.get('/company', settingController.getCompanySettings);
router.put('/company/:key', settingController.updateCompanySetting);

module.exports = router;