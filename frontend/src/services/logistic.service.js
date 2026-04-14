import apiService from './api.service';

const logisticService = {
  // Dashboard
  getDashboard: () => apiService.get('/logistics/dashboard'),
  
  // Entrepôts
  getWarehouses: () => apiService.get('/logistics/warehouses'),
  getWarehouse: (id) => apiService.get(`/logistics/warehouses/${id}`),
  createWarehouse: (data) => apiService.post('/logistics/warehouses', data),
  updateWarehouse: (id, data) => apiService.put(`/logistics/warehouses/${id}`, data),
  deleteWarehouse: (id) => apiService.delete(`/logistics/warehouses/${id}`),
  
  // Articles
  getItems: (params) => apiService.get('/logistics/items', { params }),
  getItem: (id) => apiService.get(`/logistics/items/${id}`),
  createItem: (data) => apiService.post('/logistics/items', data),
  updateItem: (id, data) => apiService.put(`/logistics/items/${id}`, data),
  deleteItem: (id) => apiService.delete(`/logistics/items/${id}`),
  
  // Catégories
  getCategories: () => apiService.get('/logistics/categories'),
  createCategory: (data) => apiService.post('/logistics/categories', data),
  
  // Stocks
  getInventory: (params) => apiService.get('/logistics/inventory', { params }),
  getLowStock: () => apiService.get('/logistics/inventory/low-stock'),
  
  // Mouvements
  getMovements: (params) => apiService.get('/logistics/movements', { params }),
  createMovement: (data) => apiService.post('/logistics/movements', data),
  completeMovement: (id) => apiService.post(`/logistics/movements/${id}/complete`),
  
  // Commandes fournisseurs
  getPurchaseOrders: (params) => apiService.get('/logistics/purchase-orders', { params }),
  getPurchaseOrder: (id) => apiService.get(`/logistics/purchase-orders/${id}`),
  createPurchaseOrder: (data) => apiService.post('/logistics/purchase-orders', data),
  updatePurchaseOrder: (id, data) => apiService.put(`/logistics/purchase-orders/${id}`, data),
  approvePurchaseOrder: (id) => apiService.post(`/logistics/purchase-orders/${id}/approve`),
  receivePurchaseOrder: (id, data) => apiService.post(`/logistics/purchase-orders/${id}/receive`, data),
  cancelPurchaseOrder: (id) => apiService.post(`/logistics/purchase-orders/${id}/cancel`),
  
  // Expéditions
  getShipments: (params) => apiService.get('/logistics/shipments', { params }),
  getShipment: (id) => apiService.get(`/logistics/shipments/${id}`),
  createShipment: (data) => apiService.post('/logistics/shipments', data),
  updateShipment: (id, data) => apiService.put(`/logistics/shipments/${id}`, data),
  updateShipmentStatus: (id, status) => apiService.patch(`/logistics/shipments/${id}/status`, { status }),
  
  // Lots
  getBatches: (params) => apiService.get('/logistics/batches', { params }),
  createBatch: (data) => apiService.post('/logistics/batches', data)
};

export { logisticService };