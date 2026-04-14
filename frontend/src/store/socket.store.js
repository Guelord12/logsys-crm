import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './auth.store';
import { useNotificationStore } from './notification.store';
import { useMessageStore } from './message.store';
import { useMeetingStore } from './meeting.store';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Configuration des logs - Mettre à false pour désactiver les logs
const DEBUG = false;
const log = (...args) => DEBUG && console.log(...args);
const warn = (...args) => DEBUG && console.warn(...args);

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,

  connect: (userId) => {
    const { socket } = get();
    
    // Éviter les connexions multiples
    if (socket?.connected) {
      log('Socket already connected');
      return;
    }
    
    set({ isConnecting: true });
    
    const token = localStorage.getItem('accessToken');
    
    const newSocket = io(SOCKET_URL, {
      auth: {
        userId,
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    newSocket.on('connect', () => {
      log('✅ Socket connected');
      set({ isConnected: true, isConnecting: false });
      
      newSocket.emit('join:user', { userId });
      
      const { user } = useAuthStore.getState();
      if (user?.companyId) {
        newSocket.emit('join:company', { companyId: user.companyId });
      }
    });
    
    newSocket.on('disconnect', (reason) => {
      log(`🔌 Socket disconnected: ${reason}`);
      set({ isConnected: false });
    });
    
    newSocket.on('connect_error', (error) => {
      warn('❌ Socket connection error:', error.message);
      set({ isConnected: false, isConnecting: false });
    });
    
    // Écouteurs d'événements
    newSocket.on('notification:new', (notification) => {
      const { addNotification } = useNotificationStore.getState();
      addNotification(notification);
      
      toast(notification.title, {
        description: notification.message,
        icon: notification.priority === 'HIGH' ? '🔔' : '📬'
      });
    });
    
    newSocket.on('message:new', (message) => {
      const { addMessage } = useMessageStore.getState();
      addMessage(message);
      
      toast.success(`Nouveau message de ${message.senderName}`, {
        description: message.subject
      });
    });
    
    newSocket.on('meeting:started', (meeting) => {
      const { setMeetingStatus } = useMeetingStore.getState();
      setMeetingStatus(meeting.id, 'ONGOING');
      
      toast(`La réunion "${meeting.title}" a commencé`, {
        icon: '🎥',
        action: {
          label: 'Rejoindre',
          onClick: () => window.location.href = `/meetings/${meeting.id}`
        }
      });
    });
    
    newSocket.on('meeting:invitation', (invitation) => {
      toast(`Invitation à la réunion "${invitation.meetingTitle}"`, {
        icon: '📅',
        action: {
          label: 'Voir',
          onClick: () => window.location.href = `/meetings/${invitation.meetingId}`
        }
      });
    });
    
    newSocket.on('user:online', (data) => {
      log('👤 User online:', data.userId);
    });
    
    newSocket.on('user:offline', (data) => {
      log('👤 User offline:', data.userId);
    });
    
    newSocket.on('subscription:expiring', (data) => {
      toast.warning(`Abonnement expire dans ${data.daysRemaining} jours`, {
        description: `Votre abonnement ${data.planName} arrive à expiration`,
        duration: 10000
      });
    });
    
    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    
    if (socket) {
      // Vérifier si le socket est connecté avant de le fermer
      if (socket.connected) {
        socket.disconnect();
      }
      // Supprimer tous les listeners
      socket.removeAllListeners();
      set({ socket: null, isConnected: false });
    }
  },

  emit: (event, data) => {
    const { socket, isConnected } = get();
    
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      warn(`Cannot emit "${event}": socket not connected`);
    }
  },

  on: (event, callback) => {
    const { socket } = get();
    
    if (socket) {
      socket.on(event, callback);
    }
  },

  off: (event, callback) => {
    const { socket } = get();
    
    if (socket) {
      socket.off(event, callback);
    }
  }
}));