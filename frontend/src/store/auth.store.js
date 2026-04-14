import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiService from '@services/api.service';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setTokens: ({ accessToken, refreshToken }) => {
        // Stocker dans localStorage pour l'intercepteur axios
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true
        });
        
        // Décoder le token pour obtenir les infos utilisateur
        if (accessToken) {
          try {
            const decoded = jwtDecode(accessToken);
            set({ user: decoded });
          } catch (error) {
            console.error('Failed to decode token:', error);
          }
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.post('/auth/login', credentials);
          const { user, tokens } = response.data.data;
          
          // Stocker dans localStorage
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
          
          return { success: true, data: response.data };
          
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Échec de la connexion'
          });
          
          return {
            success: false,
            error: error.response?.data?.message || 'Échec de la connexion'
          };
        }
      },

      logout: async () => {
        try {
          await apiService.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Nettoyer localStorage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false
          });
          
          // Ne pas rediriger si on est déjà sur la page de login
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      },

      checkAuth: async () => {
        const { accessToken, refreshToken } = get();
        
        // Vérifier d'abord localStorage
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        
        const currentAccessToken = accessToken || storedAccessToken;
        const currentRefreshToken = refreshToken || storedRefreshToken;
        
        if (!currentAccessToken) {
          set({ isAuthenticated: false });
          return false;
        }
        
        try {
          // Vérifier si le token est expiré
          const decoded = jwtDecode(currentAccessToken);
          const isExpired = decoded.exp * 1000 < Date.now();
          
          if (isExpired && currentRefreshToken) {
            // Rafraîchir le token
            try {
              const response = await apiService.post('/auth/refresh-token', {
                refreshToken: currentRefreshToken
              });
              
              const { accessToken: newAccessToken } = response.data.data;
              localStorage.setItem('accessToken', newAccessToken);
              
              get().setTokens({ 
                accessToken: newAccessToken, 
                refreshToken: currentRefreshToken 
              });
              
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              get().logout();
              return false;
            }
            
          } else if (isExpired) {
            get().logout();
            return false;
          }
          
          // Synchroniser le state avec localStorage si nécessaire
          if (!accessToken && storedAccessToken) {
            set({ 
              accessToken: storedAccessToken, 
              refreshToken: storedRefreshToken,
              isAuthenticated: true 
            });
          }
          
          // Vérifier que l'utilisateur existe toujours
          try {
            const userResponse = await apiService.get('/auth/me');
            set({ user: userResponse.data.data, isAuthenticated: true });
          } catch (meError) {
            console.error('Failed to fetch user:', meError);
            // Ne pas déconnecter si c'est juste une erreur réseau
            if (meError.response?.status === 401) {
              get().logout();
              return false;
            }
          }
          
          return true;
          
        } catch (error) {
          console.error('Auth check failed:', error);
          // Ne pas déconnecter automatiquement pour les erreurs réseau
          if (error.response?.status === 401) {
            get().logout();
            return false;
          }
          return get().isAuthenticated;
        }
      },

      updateProfile: async (profileData) => {
        try {
          const response = await apiService.put('/auth/profile', profileData);
          const { user } = response.data.data;
          
          set({ user });
          
          return { success: true, data: user };
          
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Échec de la mise à jour'
          };
        }
      },

      changePassword: async (passwordData) => {
        try {
          await apiService.post('/auth/change-password', passwordData);
          return { success: true };
          
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Échec du changement de mot de passe'
          };
        }
      },

      hasPermission: (permission) => {
        const { user } = get();
        
        if (!user) return false;
        
        // Admin système a toutes les permissions
        if (user.isSystemAdmin) return true;
        
        // Vérifier dans les permissions de l'utilisateur
        return user.permissions?.includes(permission) || false;
      },

      hasModule: (moduleCode) => {
        const { user } = get();
        
        if (!user) return false;
        
        // Admin système a accès à tout
        if (user.isSystemAdmin) return true;
        
        // Vérifier les modules de l'entreprise
        return user.company?.modules?.includes(moduleCode) || false;
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'logsys-auth-storage',
      // Stocker uniquement les données essentielles
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          fullName: state.user.fullName,
          isSystemAdmin: state.user.isSystemAdmin,
          isCompanyAdmin: state.user.isCompanyAdmin,
          companyId: state.user.companyId,
          permissions: state.user.permissions
        } : null,
        isAuthenticated: state.isAuthenticated
      }),
      // Migrer les anciennes versions si nécessaire
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration depuis la version 0
          persistedState.isAuthenticated = !!persistedState.accessToken;
        }
        return persistedState;
      }
    }
  )
);