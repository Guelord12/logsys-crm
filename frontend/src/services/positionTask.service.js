// frontend/src/services/positionTask.service.js

import apiService from './api.service';

const positionTaskService = {
  // Tâches de poste
  getPositionTasks: (positionId) => apiService.get(`/position-tasks/${positionId}`),
  createPositionTask: (data) => apiService.post('/position-tasks', data),
  updatePositionTask: (id, data) => apiService.put(`/position-tasks/${id}`, data),
  deletePositionTask: (id) => apiService.delete(`/position-tasks/${id}`),
  
  // Génération
  generateUserTasks: (userId) => apiService.post(`/position-tasks/generate/${userId}`),
  
  // Templates
  getTaskTemplates: () => apiService.get('/position-tasks/templates'),
  
  // Workflows
  getWorkflows: (companyId) => apiService.get(`/workflows${companyId ? `?companyId=${companyId}` : ''}`),
  createWorkflow: (data) => apiService.post('/workflows', data),
  executeWorkflow: (workflowId, data) => apiService.post(`/workflows/${workflowId}/execute`, data)
};

export { positionTaskService };