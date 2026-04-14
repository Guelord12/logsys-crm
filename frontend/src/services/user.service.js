import apiService from './api.service';

const userService = {
  getUsers: (params) => apiService.get('/users', { params }),
  getUser: (id) => apiService.get(`/users/${id}`),
  createUser: (data) => apiService.post('/users', data),
  updateUser: (id, data) => apiService.put(`/users/${id}`, data),
  deleteUser: (id) => apiService.delete(`/users/${id}`),
  resetPassword: (id) => apiService.post(`/users/${id}/reset-password`),
  getProfile: () => apiService.get('/users/profile'),
  updateProfile: (data) => apiService.put('/users/profile', data),
  getUserRoles: (id) => apiService.get(`/users/${id}/roles`),
  assignRole: (userId, roleId) => apiService.post(`/users/${userId}/roles`, { roleId }),
  removeRole: (userId, roleId) => apiService.delete(`/users/${userId}/roles/${roleId}`)
};

export { userService };