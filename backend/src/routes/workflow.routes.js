const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');

router.get('/', workflowController.getWorkflows);
router.get('/logs', workflowController.getWorkflowLogs);
router.post('/', workflowController.createWorkflow);
router.put('/:id', workflowController.updateWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);
router.post('/:id/execute', workflowController.executeWorkflow);
router.patch('/:id/toggle', workflowController.toggleWorkflow);

module.exports = router;