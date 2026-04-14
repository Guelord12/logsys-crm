const express = require('express');
const router = express.Router();
const positionTaskController = require('../controllers/positionTask.controller');

router.get('/templates', positionTaskController.getTemplates);
router.get('/:positionId', positionTaskController.getPositionTasks);
router.post('/', positionTaskController.createPositionTask);
router.put('/:id', positionTaskController.updatePositionTask);
router.delete('/:id', positionTaskController.deletePositionTask);
router.post('/generate/:userId', positionTaskController.generateUserTasks);

module.exports = router;