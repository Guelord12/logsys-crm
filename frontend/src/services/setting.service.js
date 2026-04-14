import apiService from './api.service';

const settingService = {
  getSettings: () => apiService.get('/settings'),
  getPublicSettings: () => apiService.get('/settings/public'),
  updateSetting: (key, value) => apiService.put(`/settings/${key}`, { value }),
  getCompanySettings: () => apiService.get('/settings/company'),
  updateCompanySetting: (key, value) => apiService.put(`/settings/company/${key}`, { value })
};

export { settingService };