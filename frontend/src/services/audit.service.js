import apiService from './api.service';

const auditService = {
  getAuditLogs: (params) => apiService.get('/audit', { params }),
  
  getAuditStats: () => apiService.get('/audit/stats'),
  
  exportAuditLogs: async (params) => {
    try {
      const response = await apiService.get('/audit/export', { 
        params, 
        responseType: 'blob' 
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur export:', error);
      throw error;
    }
  },
  
  getCompanyAuditLogs: (companyId, params) => apiService.get(`/audit/company/${companyId}`, { params }),
  
  getUserActivity: (userId) => apiService.get(`/audit/user/${userId}`)
};

export { auditService };