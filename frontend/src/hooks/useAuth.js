import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';

export const useAuth = (options = {}) => {
  const { requireAuth = true, redirectTo = '/login' } = options;
  
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      const isValid = await checkAuth();
      
      if (requireAuth && !isValid) {
        navigate(redirectTo);
      }
    };
    
    verifyAuth();
  }, [requireAuth, redirectTo, navigate]);

  return {
    isAuthenticated,
    isLoading,
    user
  };
};