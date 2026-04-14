import apiService from './api.service';

const subscriptionService = {
  getPlans: () => apiService.get('/subscriptions/plans'),
  getPlan: (id) => apiService.get(`/subscriptions/plans/${id}`),
  getCompanySubscription: (companyId) => apiService.get(`/subscriptions/company/${companyId}`),
  createSubscription: (data) => apiService.post('/subscriptions', data),
  updateSubscription: (companyId, data) => apiService.put(`/subscriptions/company/${companyId}`, data),
  cancelSubscription: (companyId, reason) => 
    apiService.post(`/subscriptions/company/${companyId}/cancel`, { reason }),
  reactivateSubscription: (companyId) => 
    apiService.post(`/subscriptions/company/${companyId}/reactivate`),
  getSubscriptionHistory: (companyId) => apiService.get(`/subscriptions/company/${companyId}/history`),
  getUpcomingInvoice: (companyId) => apiService.get(`/subscriptions/company/${companyId}/upcoming-invoice`),
  getExpiringSubscriptions: () => apiService.get('/subscriptions/expiring'),
  getSubscriptionStats: () => apiService.get('/subscriptions/stats')
};

export { subscriptionService };