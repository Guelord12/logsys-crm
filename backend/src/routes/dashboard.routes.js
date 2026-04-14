const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Route principale - redirige automatiquement selon le rôle
router.get('/', dashboardController.getDashboard);

// Statistiques générales
router.get('/stats', dashboardController.getStats);

// Activité récente
router.get('/recent-activity', dashboardController.getRecentActivity);

// Routes spécifiques aux rôles
router.get('/system', authorize('SYSTEM_ADMIN'), dashboardController.getSystemAdminDashboard);
router.get('/company', authorize('COMPANY_ADMIN'), dashboardController.getCompanyAdminDashboard);
router.get('/user', dashboardController.getUserDashboard);

module.exports = router;