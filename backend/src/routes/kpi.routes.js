const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpi.controller');

router.get('/', kpiController.getKPIs);
router.get('/values', kpiController.getKPIValues);
router.get('/dashboard', kpiController.getKPIDashboard);
router.post('/:kpiId/values', kpiController.addKPIValue);
router.put('/:id', kpiController.updateKPI);
router.post('/calculate', kpiController.calculateKPIs);

module.exports = router;