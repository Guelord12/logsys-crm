import apiService from './api.service';

const notificationService = {
  getNotifications: (params) => apiService.get('/notifications', { params }),
  getUnreadCount: () => apiService.get('/notifications/unread/count'),
  markAsRead: (notificationIds) => apiService.post('/notifications/mark-read', { notificationIds }),
  markAllAsRead: () => apiService.post('/notifications/mark-all-read'),
  deleteNotification: (id) => apiService.delete(`/notifications/${id}`),
  deleteAllNotifications: () => apiService.delete('/notifications'),
  archiveNotification: (id) => apiService.post(`/notifications/${id}/archive`),
  getPreferences: () => apiService.get('/notifications/preferences'),
  updatePreferences: (data) => apiService.put('/notifications/preferences', data)
};

export { notificationService };