import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@store/auth.store';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const auth = useAuthStore();

  useEffect(() => {
    auth.checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};