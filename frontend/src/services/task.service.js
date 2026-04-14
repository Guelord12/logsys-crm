import apiService from './api.service';

const taskService = {
  getTasks: (params) => apiService.get('/tasks', { params }),
  getTask: (id) => apiService.get(`/tasks/${id}`),
  createTask: (data) => apiService.post('/tasks', data),
  updateTask: (id, data) => apiService.put(`/tasks/${id}`, data),
  deleteTask: (id) => apiService.delete(`/tasks/${id}`),
  updateStatus: (id, status) => apiService.patch(`/tasks/${id}/status`, { status }),
  assignTask: (id, userId) => apiService.post(`/tasks/${id}/assign`, { userId }),
  addComment: (id, comment) => apiService.post(`/tasks/${id}/comments`, { comment }),
  getComments: (id) => apiService.get(`/tasks/${id}/comments`), // ✅ AJOUTÉ
  getMyTasks: (params) => apiService.get('/tasks/my-tasks', { params }),
  getTaskStats: () => apiService.get('/tasks/stats')
};

export { taskService };