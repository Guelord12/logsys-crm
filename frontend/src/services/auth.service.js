import apiService from './api.service';

const authService = {
  login: (credentials) => apiService.post('/auth/login', credentials),
  logout: () => apiService.post('/auth/logout'),
  register: (userData) => apiService.post('/auth/register', userData),
  refreshToken: (refreshToken) => apiService.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => apiService.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => apiService.post('/auth/reset-password', { token, newPassword }),
  verifyEmail: (token) => apiService.get(`/auth/verify-email/${token}`),
  changePassword: (data) => apiService.post('/auth/change-password', data),
  getProfile: () => apiService.get('/auth/me'),
  updateProfile: (data) => apiService.put('/auth/profile', data),
  checkPermission: (permission) => apiService.get(`/auth/check-permission/${permission}`)
};

export { authService };