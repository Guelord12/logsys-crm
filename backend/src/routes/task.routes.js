const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', taskController.getTasks);
router.get('/my-tasks', taskController.getMyTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/:id', taskController.getTask);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.patch('/:id/status', taskController.updateStatus);
router.post('/:id/assign', taskController.assignTask);
router.get('/:id/comments', taskController.getComments);
router.post('/:id/comments', taskController.addComment);

module.exports = router;