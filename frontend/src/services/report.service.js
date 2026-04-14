import apiService from './api.service';

const reportService = {
  // Rapports comptables
  getBalanceSheet: (params) => apiService.get('/accounting/reports/balance-sheet', { params }),
  getIncomeStatement: (params) => apiService.get('/accounting/reports/income-statement', { params }),
  getTrialBalance: (params) => apiService.get('/accounting/reports/trial-balance', { params }),
  getGeneralLedger: (params) => apiService.get('/accounting/reports/general-ledger', { params }),
  getAgedReceivables: (params) => apiService.get('/accounting/reports/aged-receivables', { params }),
  getAgedPayables: (params) => apiService.get('/accounting/reports/aged-payables', { params }),
  
  // Rapports logistiques
  getInventoryReport: (params) => apiService.get('/logistics/reports/inventory', { params }),
  getStockMovementReport: (params) => apiService.get('/logistics/reports/movements', { params }),
  getPurchaseReport: (params) => apiService.get('/logistics/reports/purchases', { params }),
  
  // Rapports généraux
  getUserActivityReport: (params) => apiService.get('/reports/user-activity', { params }),
  getCompanyReport: (companyId, params) => apiService.get(`/reports/company/${companyId}`, { params }),
  getAuditReport: (params) => apiService.get('/reports/audit', { params }),
  
  // Export
  exportReport: (type, params, format = 'pdf') => 
    apiService.download(`/reports/export/${type}`, `${type}_report.${format}`, { params: { ...params, format } })
};

export { reportService };