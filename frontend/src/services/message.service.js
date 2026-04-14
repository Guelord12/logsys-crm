import apiService from './api.service';

const messageService = {
  // Dossiers
  getFolders: () => apiService.get('/messages/folders'),
  
  getFolderCounts: () => apiService.get('/messages/folders/counts'),
  
  // Messages
  getMessages: (params) => apiService.get('/messages', { params }),
  
  getMessage: (id) => apiService.get(`/messages/${id}`),
  
  sendMessage: (data) => apiService.post('/messages', data),
  
  saveDraft: (data) => apiService.post('/messages/draft', data),
  
  updateDraft: (id, data) => apiService.put(`/messages/${id}/draft`, data),
  
  sendDraft: (id) => apiService.post(`/messages/${id}/send`),
  
  // Pièces jointes
  uploadAttachments: (formData, onProgress) => 
    apiService.upload('/messages/upload', formData, onProgress),
  
  downloadAttachment: (messageId, attachmentId) => 
    apiService.download(`/messages/${messageId}/attachments/${attachmentId}`, 'attachment'),
  
  // Actions
  markAsRead: (messageIds) => apiService.post('/messages/mark-read', { messageIds }),
  
  markAsUnread: (messageIds) => apiService.post('/messages/mark-unread', { messageIds }),
  
  toggleStar: (messageId, isStarred) => 
    apiService.post('/messages/toggle-star', { messageId, isStarred }),
  
  moveToFolder: (messageIds, folder) => 
    apiService.post('/messages/move', { messageIds, folder }),
  
  deleteMessages: (messageIds) => apiService.delete('/messages', { data: { messageIds } }),
  
  deleteMessage: (id) => apiService.delete(`/messages/${id}`),
  
  // Réponses et transferts
  replyToMessage: (id, data) => apiService.post(`/messages/${id}/reply`, data),
  
  forwardMessage: (id, data) => apiService.post(`/messages/${id}/forward`, data),
};

export { messageService };