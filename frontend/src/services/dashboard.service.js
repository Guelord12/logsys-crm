import apiService from './api.service';

const dashboardService = {
  // Route principale (redirige selon le rôle)
  getDashboard: () => apiService.get('/dashboard'),
  
  // Routes spécifiques aux rôles (corrigées)
  getSystemAdminDashboard: () => apiService.get('/dashboard/system'),
  getCompanyAdminDashboard: () => apiService.get('/dashboard/company'),
  getUserDashboard: () => apiService.get('/dashboard/user'),
  
  // Statistiques
  getStats: () => apiService.get('/dashboard/stats'),
  
  // Activité récente
  getRecentActivity: (limit = 10) => apiService.get('/dashboard/recent-activity', { params: { limit } })
};

export { dashboardService };