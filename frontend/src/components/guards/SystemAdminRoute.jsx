import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';

const SystemAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default SystemAdminRoute;