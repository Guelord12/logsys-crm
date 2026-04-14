const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Gestion des entreprises
 */

// =====================================================
// ✅ ROUTES SPÉCIFIQUES (SANS PARAMÈTRES) EN PREMIER
// =====================================================

// Permissions et rôles (DOIVENT ÊTRE AVANT /:id)
router.get('/permissions', companyController.getPermissions);
router.get('/roles', companyController.getRoles);
router.get('/roles/:roleId', companyController.getRole);
router.post('/roles', authorize('SYSTEM_ADMIN', 'COMPANY_ADMIN'), companyController.createRole);
router.put('/roles/:roleId', authorize('SYSTEM_ADMIN', 'COMPANY_ADMIN'), companyController.updateRole);
router.delete('/roles/:roleId', authorize('SYSTEM_ADMIN', 'COMPANY_ADMIN'), companyController.deleteRole);

// Statistiques (accessible aux admins système)
router.get('/stats', authorize('SYSTEM_ADMIN'), companyController.getCompaniesStats);

// Liste des entreprises (accessible aux admins)
router.get('/', authorize('SYSTEM_ADMIN', 'COMPANY_ADMIN'), companyController.getAllCompanies);

// Création d'entreprise (admin système uniquement)
router.post('/', authorize('SYSTEM_ADMIN'), validate(schemas.createCompany), companyController.createCompany);

// =====================================================
// ✅ ROUTES AVEC PARAMÈTRES DYNAMIQUES EN DERNIER
// =====================================================

// Gestion d'une entreprise spécifique
router.get('/:id', companyController.getCompanyById);
router.put('/:id', authorize('SYSTEM_ADMIN'), validate(schemas.updateCompany), companyController.updateCompany);
router.delete('/:id', authorize('SYSTEM_ADMIN'), companyController.deleteCompany);

// Gestion des abonnements
router.put('/:id/subscription', authorize('SYSTEM_ADMIN'), validate(schemas.updateSubscription), companyController.updateSubscription);

// Utilisateurs de l'entreprise
router.get('/:id/users', companyController.getCompanyUsers);

// Paramètres de l'entreprise
router.get('/:id/settings', companyController.getCompanySettings);
router.put('/:id/settings', companyController.updateCompanySettings);

module.exports = router;s