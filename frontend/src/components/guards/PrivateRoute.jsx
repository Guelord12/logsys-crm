import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';

const PrivateRoute = ({ children, requireModules = [] }) => {
  const { isAuthenticated, user, hasModule } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier les modules requis
  if (requireModules.length > 0) {
    const hasAllModules = requireModules.every(module => hasModule(module));
    
    if (!hasAllModules) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default PrivateRoute;