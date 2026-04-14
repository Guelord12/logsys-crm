const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');

router.get('/chart', departmentController.getOrganizationChart);
router.get('/', departmentController.getDepartments);
router.get('/stats', departmentController.getDepartmentStats);
router.get('/:id', departmentController.getDepartment);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);
router.post('/:departmentId/manager', departmentController.assignDepartmentManager);

module.exports = router;