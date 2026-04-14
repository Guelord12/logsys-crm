// frontend/src/services/department.service.js

import apiService from './api.service';

const departmentService = {
  // Organigramme
  getOrganizationChart: (companyId) => 
    apiService.get(`/departments/chart${companyId ? `?companyId=${companyId}` : ''}`),
  
  // CRUD Départements
  getDepartments: (params) => apiService.get('/departments', { params }),
  getDepartment: (id) => apiService.get(`/departments/${id}`),
  createDepartment: (data) => apiService.post('/departments', data),
  updateDepartment: (id, data) => apiService.put(`/departments/${id}`, data),
  deleteDepartment: (id) => apiService.delete(`/departments/${id}`),
  
  // Manager
  assignManager: (departmentId, userId) => 
    apiService.post(`/departments/${departmentId}/manager`, { userId }),
  
  // Statistiques
  getDepartmentStats: (companyId) => 
    apiService.get(`/departments/stats${companyId ? `?companyId=${companyId}` : ''}`)
};

export { departmentService };