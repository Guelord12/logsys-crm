const express = require('express');
const router = express.Router();
const logisticController = require('../controllers/logistic.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Logistics
 *   description: Gestion logistique
 */

// Dashboard
router.get('/dashboard', logisticController.getDashboard);

// Entrepôts
router.get('/warehouses', logisticController.getWarehouses);
router.post('/warehouses', logisticController.createWarehouse);
router.put('/warehouses/:id', logisticController.updateWarehouse);
router.delete('/warehouses/:id', logisticController.deleteWarehouse);

// Catégories
router.get('/categories', logisticController.getCategories);
router.post('/categories', logisticController.createCategory);

// Articles
router.get('/items', logisticController.getItems);
router.post('/items', logisticController.createItem);
router.put('/items/:id', logisticController.updateItem);
router.delete('/items/:id', logisticController.deleteItem);

// Stocks
router.get('/inventory', logisticController.getInventory);
router.get('/inventory/low-stock', logisticController.getLowStock);

// Mouvements
router.get('/movements', logisticController.getMovements);
router.post('/movements', logisticController.createMovement);

// Lots
router.get('/batches', logisticController.getBatches);
router.post('/batches', logisticController.createBatch);

// Commandes fournisseurs
router.get('/purchase-orders', logisticController.getPurchaseOrders);
router.post('/purchase-orders', logisticController.createPurchaseOrder);
router.post('/purchase-orders/:id/approve', logisticController.approvePurchaseOrder);
router.post('/purchase-orders/:id/receive', logisticController.receivePurchaseOrder);
router.post('/purchase-orders/:id/cancel', logisticController.cancelPurchaseOrder);

// Expéditions
router.get('/shipments', logisticController.getShipments);
router.post('/shipments', logisticController.createShipment);
router.patch('/shipments/:id/status', logisticController.updateShipmentStatus);

module.exports = router;