import axios from 'axios';
import { useAuthStore } from '@store/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Variable pour éviter les boucles de rafraîchissement
let isRefreshing = false;
let refreshSubscribers = [];

// Fonction pour ajouter des callbacks en attente de rafraîchissement
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Fonction pour exécuter les callbacks après rafraîchissement
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

// Intercepteur de requête - Ajouter le token
api.interceptors.request.use(
  (config) => {
    // Priorité au state Zustand, puis fallback sur localStorage
    const state = useAuthStore.getState();
    const token = state.accessToken || localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse - Gérer les erreurs et rafraîchir le token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si l'erreur est 401 et qu'on n'a pas déjà essayé de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Si on est déjà en train de rafraîchir, mettre en attente
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const state = useAuthStore.getState();
        const refreshToken = state.refreshToken || localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });
        
        const { accessToken } = response.data.data;
        
        // Mettre à jour le token partout
        localStorage.setItem('accessToken', accessToken);
        
        const store = useAuthStore.getState();
        if (store.setTokens) {
          store.setTokens({ accessToken, refreshToken });
        }
        
        // Notifier les requêtes en attente
        onTokenRefreshed(accessToken);
        isRefreshing = false;
        
        // Réessayer la requête originale
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        
        // Si le rafraîchissement échoue, déconnecter l'utilisateur
        console.error('Token refresh failed:', refreshError);
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        const store = useAuthStore.getState();
        if (store.logout) {
          store.logout();
        }
        
        // Rediriger vers login si pas déjà sur login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Gérer les autres erreurs
    const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue';
    
    // Log en développement
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: errorMessage
      });
    }
    
    return Promise.reject(error);
  }
);

// Méthodes génériques CRUD
const apiService = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  patch: (url, data, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  
  // Upload de fichier
  upload: (url, formData, onUploadProgress) => {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
  },
  
  // Téléchargement de fichier
  download: (url, filename) => {
    return api.get(url, {
      responseType: 'blob'
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  }
};

export default apiService;