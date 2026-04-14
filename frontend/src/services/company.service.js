import apiService from './api.service';

const companyService = {
  // =====================================================
  // CRUD Entreprises
  // =====================================================
  
  /**
   * Récupérer toutes les entreprises (admin système uniquement)
   */
  getCompanies: (params) => apiService.get('/companies', { params }),
  
  /**
   * Récupérer une entreprise par ID
   */
  getCompanyById: (id) => apiService.get(`/companies/${id}`),
  
  /**
   * Créer une nouvelle entreprise
   */
  createCompany: (data) => apiService.post('/companies', data),
  
  /**
   * Mettre à jour une entreprise
   */
  updateCompany: (id, data) => apiService.put(`/companies/${id}`, data),
  
  /**
   * Supprimer une entreprise (admin système uniquement)
   */
  deleteCompany: (id) => apiService.delete(`/companies/${id}`),
  
  // =====================================================
  // Statistiques
  // =====================================================
  
  /**
   * Récupérer les statistiques des entreprises
   */
  getCompaniesStats: () => apiService.get('/companies/stats'),
  
  // =====================================================
  // Abonnements
  // =====================================================
  
  /**
   * Mettre à jour l'abonnement d'une entreprise
   */
  updateSubscription: (companyId, data) => 
    apiService.put(`/companies/${companyId}/subscription`, data),
  
  /**
   * Annuler l'abonnement d'une entreprise
   */
  cancelSubscription: (companyId, reason) => 
    apiService.post(`/companies/${companyId}/subscription/cancel`, { reason }),
  
  /**
   * Réactiver l'abonnement d'une entreprise
   */
  reactivateSubscription: (companyId) => 
    apiService.post(`/companies/${companyId}/subscription/reactivate`),
  
  // =====================================================
  // Utilisateurs de l'entreprise
  // =====================================================
  
  /**
   * Récupérer les utilisateurs d'une entreprise
   */
  getCompanyUsers: (companyId, params) => 
    apiService.get(`/companies/${companyId}/users`, { params }),
  
  // =====================================================
  // Rôles et permissions
  // =====================================================
  
  /**
   * Récupérer tous les rôles de l'entreprise
   */
  getRoles: () => apiService.get('/companies/roles'),
  
  /**
   * Récupérer un rôle par ID
   */
  getRole: (id) => apiService.get(`/companies/roles/${id}`),
  
  /**
   * Créer un nouveau rôle
   */
  createRole: (data) => apiService.post('/companies/roles', data),
  
  /**
   * Mettre à jour un rôle
   */
  updateRole: (id, data) => apiService.put(`/companies/roles/${id}`, data),
  
  /**
   * Supprimer un rôle
   */
  deleteRole: (id) => apiService.delete(`/companies/roles/${id}`),
  
  /**
   * Récupérer toutes les permissions disponibles
   */
  getPermissions: () => apiService.get('/companies/permissions'),
  
  /**
   * Assigner un rôle à un utilisateur
   */
  assignRoleToUser: (userId, roleId) => 
    apiService.post(`/users/${userId}/roles`, { roleId }),
  
  /**
   * Retirer un rôle d'un utilisateur
   */
  removeRoleFromUser: (userId, roleId) => 
    apiService.delete(`/users/${userId}/roles/${roleId}`),
  
  // =====================================================
  // Paramètres de l'entreprise
  // =====================================================
  
  /**
   * Récupérer les paramètres de l'entreprise
   */
  getCompanySettings: (companyId) => 
    apiService.get(`/companies/${companyId}/settings`),
  
  /**
   * Mettre à jour les paramètres de l'entreprise
   */
  updateCompanySettings: (companyId, data) => 
    apiService.put(`/companies/${companyId}/settings`, data),
  
  // =====================================================
  // Données de référence
  // =====================================================
  
  /**
   * Récupérer les secteurs d'activité
   */
  getBusinessSectors: () => apiService.get('/reference/business-sectors'),
  
  /**
   * Récupérer les pays
   */
  getCountries: () => apiService.get('/reference/countries'),
  
  /**
   * Récupérer les postes (job positions)
   */
  getJobPositions: () => apiService.get('/reference/job-positions'),
  
  /**
   * Récupérer les types d'utilisateurs
   */
  getUserTypes: () => apiService.get('/reference/user-types'),
  
  // =====================================================
  // Tableau de bord entreprise
  // =====================================================
  
  /**
   * Récupérer les données du tableau de bord entreprise
   */
  getCompanyDashboard: (companyId) => 
    apiService.get(`/companies/${companyId}/dashboard`),
  
  /**
   * Récupérer l'activité récente de l'entreprise
   */
  getCompanyRecentActivity: (companyId, limit = 10) => 
    apiService.get(`/companies/${companyId}/activity`, { params: { limit } }),
  
  // =====================================================
  // Audit de l'entreprise
  // =====================================================
  
  /**
   * Récupérer les logs d'audit de l'entreprise
   */
  getCompanyAuditLogs: (companyId, params) => 
    apiService.get(`/companies/${companyId}/audit`, { params }),
  
  // =====================================================
  // Modules et fonctionnalités
  // =====================================================
  
  /**
   * Récupérer les modules activés pour l'entreprise
   */
  getCompanyModules: (companyId) => 
    apiService.get(`/companies/${companyId}/modules`),
  
  /**
   * Activer/désactiver un module pour l'entreprise
   */
  toggleCompanyModule: (companyId, moduleCode, enabled) => 
    apiService.put(`/companies/${companyId}/modules/${moduleCode}`, { enabled }),
  
  // =====================================================
  // Facturation et paiements
  // =====================================================
  
  /**
   * Récupérer l'historique des factures de l'entreprise
   */
  getCompanyInvoices: (companyId, params) => 
    apiService.get(`/companies/${companyId}/invoices`, { params }),
  
  /**
   * Récupérer les paiements de l'entreprise
   */
  getCompanyPayments: (companyId, params) => 
    apiService.get(`/companies/${companyId}/payments`, { params }),
  
  /**
   * Télécharger une facture
   */
  downloadInvoice: (companyId, invoiceId) => 
    apiService.download(`/companies/${companyId}/invoices/${invoiceId}/download`, `invoice_${invoiceId}.pdf`),
};

export { companyService };