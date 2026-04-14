const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accounting.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// =====================================================
// DASHBOARD
// =====================================================
router.get('/dashboard', accountingController.getDashboardData);

// =====================================================
// PLAN COMPTABLE OHADA
// =====================================================
router.get('/chart-of-accounts', accountingController.getChartOfAccounts);

// =====================================================
// PÉRIODES COMPTABLES
// =====================================================
router.get('/periods', accountingController.getPeriods);
router.post('/periods', accountingController.createPeriod);

// =====================================================
// JOURNAUX COMPTABLES
// =====================================================
router.get('/journals', accountingController.getJournals);

// =====================================================
// ÉCRITURES COMPTABLES
// =====================================================
router.get('/entries', accountingController.getEntries);
router.get('/entries/recent', accountingController.getRecentEntries);
router.get('/entries/:id', accountingController.getEntry);
router.post('/entries', accountingController.createEntry);
router.post('/entries/:id/post', accountingController.postEntry);

// =====================================================
// FACTURES
// =====================================================
router.get('/invoices', accountingController.getInvoices);
router.get('/invoices/unpaid', accountingController.getUnpaidInvoices);
router.post('/invoices', accountingController.createInvoice);

// =====================================================
// PAIEMENTS
// =====================================================
router.get('/payments', accountingController.getPayments);
router.post('/payments', accountingController.createPayment);

// =====================================================
// RAPPORTS (GÉNÉRATION)
// =====================================================
router.get('/reports/:type', accountingController.generateReport);

// =====================================================
// RAPPORTS (EXPORT CSV)
// =====================================================
router.get('/reports/balance-sheet/export', accountingController.exportBalanceSheet);
router.get('/reports/income-statement/export', accountingController.exportIncomeStatement);
router.get('/reports/trial-balance/export', accountingController.exportTrialBalance);
router.get('/reports/general-ledger/export', accountingController.exportGeneralLedger);
router.get('/reports/aged-balance/export', accountingController.exportAgedBalance);

module.exports = router;