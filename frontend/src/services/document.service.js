import apiService from './api.service';

const documentService = {
  getDocuments: (params) => apiService.get('/documents', { params }),
  getDocument: (id) => apiService.get(`/documents/${id}`),
  uploadDocument: (formData, onProgress) => 
    apiService.upload('/documents', formData, onProgress),
  updateDocument: (id, data) => apiService.put(`/documents/${id}`, data),
  deleteDocument: (id) => apiService.delete(`/documents/${id}`),
  downloadDocument: (id) => apiService.download(`/documents/${id}/download`, 'document'),
  previewDocument: (id) => apiService.get(`/documents/${id}/preview`),
  getVersions: (id) => apiService.get(`/documents/${id}/versions`),
  createVersion: (id, formData) => 
    apiService.upload(`/documents/${id}/versions`, formData)
};

export { documentService };