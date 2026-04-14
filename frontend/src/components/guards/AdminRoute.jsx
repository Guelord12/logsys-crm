import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';

const AdminRoute = ({ children, requireCompanyAdmin = true, requireSystemAdmin = false }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireSystemAdmin && !user?.isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireCompanyAdmin && !user?.isCompanyAdmin && !user?.isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;