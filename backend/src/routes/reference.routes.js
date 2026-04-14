const express = require('express');
const router = express.Router();
const referenceController = require('../controllers/reference.controller');

// =====================================================
// ROUTES PUBLIQUES - PAS D'AUTHENTIFICATION REQUISE
// =====================================================

// Pays
router.get('/countries', referenceController.getCountries);

// Secteurs d'activité
router.get('/business-sectors', referenceController.getBusinessSectors);

// Postes (job positions)
router.get('/job-positions', referenceController.getJobPositions);

// Types d'utilisateurs
router.get('/user-types', referenceController.getUserTypes);

// Plans d'abonnement
router.get('/subscription-plans', referenceController.getSubscriptionPlans);

module.exports = router;