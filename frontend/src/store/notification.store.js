import { create } from 'zustand';
import { notificationService } from '@services/notification.service';
import { useSocketStore } from './socket.store';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  page: 1,

  fetchNotifications: async (reset = true) => {
    const { page, notifications } = get();
    
    if (!reset && !get().hasMore) return;
    
    set({ isLoading: true });
    
    try {
      const currentPage = reset ? 1 : page;
      const response = await notificationService.getNotifications({
        page: currentPage,
        limit: 20
      });
      
      const newNotifications = response.data.data.notifications;
      const pagination = response.data.data.pagination;
      
      set({
        notifications: reset ? newNotifications : [...notifications, ...newNotifications],
        unreadCount: response.data.data.unreadCount || 0,
        page: currentPage + 1,
        hasMore: currentPage < pagination.totalPages,
        isLoading: false
      });
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationService.markAsRead([notificationId]);
      
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, status: 'READ' } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const unreadIds = get().notifications
        .filter(n => n.status === 'UNREAD')
        .map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      await notificationService.markAsRead(unreadIds);
      
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, status: 'READ' })),
        unreadCount: 0
      }));
      
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      set(state => {
        const notification = state.notifications.find(n => n.id === notificationId);
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: notification?.status === 'UNREAD' 
            ? state.unreadCount - 1 
            : state.unreadCount
        };
      });
      
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  subscribeToNotifications: () => {
    const socket = useSocketStore.getState().socket;
    
    if (socket) {
      socket.on('notification:new', (notification) => {
        get().addNotification(notification);
      });
    }
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
      page: 1,
      hasMore: true
    });
  }
}));