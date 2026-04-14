import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSocketStore } from '@store/socket.store';
import { useAuthStore } from '@store/auth.store';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const socket = useSocketStore();
  const hasConnected = useRef(false);
  const userIdRef = useRef(null);

  useEffect(() => {
    const currentUserId = user?.id;
    
    // Éviter les connexions multiples pour le même utilisateur
    if (isAuthenticated && currentUserId && !hasConnected.current) {
      hasConnected.current = true;
      userIdRef.current = currentUserId;
      socket.connect(currentUserId);
    }
    
    // Si l'utilisateur change, reconnecter
    if (isAuthenticated && currentUserId && userIdRef.current !== currentUserId) {
      socket.disconnect();
      userIdRef.current = currentUserId;
      hasConnected.current = true;
      socket.connect(currentUserId);
    }

    return () => {
      // Seulement déconnecter si c'était connecté et que l'utilisateur se déconnecte complètement
      if (!isAuthenticated && hasConnected.current) {
        socket.disconnect();
        hasConnected.current = false;
        userIdRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};