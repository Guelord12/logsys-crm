import apiService from './api.service';

const accountingService = {
  // Tableau de bord
  getDashboardData: () => apiService.get('/accounting/dashboard'),
  
  // Plan comptable
  getChartOfAccounts: (params) => apiService.get('/accounting/chart-of-accounts', { params }),
  
  getAccount: (accountNumber) => apiService.get(`/accounting/chart-of-accounts/${accountNumber}`),
  
  // Périodes comptables
  getPeriods: () => apiService.get('/accounting/periods'),
  
  createPeriod: (data) => apiService.post('/accounting/periods', data),
  
  closePeriod: (id) => apiService.post(`/accounting/periods/${id}/close`),
  
  // Journaux
  getJournals: () => apiService.get('/accounting/journals'),
  
  // Écritures comptables
  getEntries: (params) => apiService.get('/accounting/entries', { params }),
  
  getEntry: (id) => apiService.get(`/accounting/entries/${id}`),
  
  createEntry: (data) => apiService.post('/accounting/entries', data),
  
  updateEntry: (id, data) => apiService.put(`/accounting/entries/${id}`, data),
  
  postEntry: (id) => apiService.post(`/accounting/entries/${id}/post`),
  
  validateEntry: (id) => apiService.post(`/accounting/entries/${id}/validate`),
  
  deleteEntry: (id) => apiService.delete(`/accounting/entries/${id}`),
  
  getRecentEntries: (limit = 10) => apiService.get('/accounting/entries/recent', { params: { limit } }),
  
  // Factures
  getInvoices: (params) => apiService.get('/accounting/invoices', { params }),
  
  getInvoice: (id) => apiService.get(`/accounting/invoices/${id}`),
  
  createInvoice: (data) => apiService.post('/accounting/invoices', data),
  
  updateInvoice: (id, data) => apiService.put(`/accounting/invoices/${id}`, data),
  
  deleteInvoice: (id) => apiService.delete(`/accounting/invoices/${id}`),
  
  getUnpaidInvoices: () => apiService.get('/accounting/invoices/unpaid'),
  
  // Paiements
  getPayments: (params) => apiService.get('/accounting/payments', { params }),
  
  createPayment: (data) => apiService.post('/accounting/payments', data),
  
  allocatePayment: (paymentId, data) => 
    apiService.post(`/accounting/payments/${paymentId}/allocate`, data),
  
  // Rapports
  getBalanceSheet: (params) => apiService.get('/accounting/reports/balance-sheet', { params }),
  
  getIncomeStatement: (params) => apiService.get('/accounting/reports/income-statement', { params }),
  
  getTrialBalance: (params) => apiService.get('/accounting/reports/trial-balance', { params }),
  
  getGeneralLedger: (params) => apiService.get('/accounting/reports/general-ledger', { params }),
  
  // ✅ Export avec choix du format (PDF ou CSV)
  exportReport: (type, params = {}) => {
    const { format = 'pdf', period, ...otherParams } = params;
    const extension = format === 'csv' ? 'csv' : 'pdf';
    
    // Construire les paramètres de requête
    const queryParams = new URLSearchParams();
    if (period) queryParams.append('period', period);
    queryParams.append('format', format);
    Object.keys(otherParams).forEach(key => {
      if (otherParams[key]) queryParams.append(key, otherParams[key]);
    });
    
    const queryString = queryParams.toString();
    const url = `/accounting/reports/${type}/export${queryString ? `?${queryString}` : ''}`;
    
    return apiService.download(url, `${type}_report.${extension}`);
  },
};

export { accountingService };