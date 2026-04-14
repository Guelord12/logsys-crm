import { create } from 'zustand';
import { messageService } from '@services/message.service';

export const useMessageStore = create((set, get) => ({
  messages: [],
  currentMessage: null,
  folders: [],
  folderCounts: {},
  isLoading: false,
  pagination: null,

  fetchFolders: async () => {
    try {
      const response = await messageService.getFolders();
      set({ folders: response.data.data });
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  },

  fetchFolderCounts: async () => {
    try {
      const response = await messageService.getFolderCounts();
      set({ folderCounts: response.data.data });
    } catch (error) {
      console.error('Failed to fetch folder counts:', error);
    }
  },

  fetchMessages: async (params = {}) => {
    set({ isLoading: true });
    
    try {
      const response = await messageService.getMessages(params);
      
      set({
        messages: response.data.data.messages,
        pagination: response.data.data.pagination,
        isLoading: false
      });
      
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchMessage: async (id) => {
    try {
      const response = await messageService.getMessage(id);
      set({ currentMessage: response.data.data });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  sendMessage: async (data) => {
    try {
      const response = await messageService.sendMessage(data);
      get().fetchFolderCounts();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addMessage: (message) => {
    set(state => ({
      messages: [message, ...state.messages],
      folderCounts: {
        ...state.folderCounts,
        inbox: (state.folderCounts.inbox || 0) + 1,
        unread: (state.folderCounts.unread || 0) + 1
      }
    }));
  },

  markAsRead: async (messageIds) => {
    try {
      await messageService.markAsRead(messageIds);
      
      set(state => ({
        messages: state.messages.map(m => 
          messageIds.includes(m.id) ? { ...m, isRead: true } : m
        ),
        folderCounts: {
          ...state.folderCounts,
          unread: Math.max(0, (state.folderCounts.unread || 0) - messageIds.length)
        }
      }));
    } catch (error) {
      throw error;
    }
  },

  toggleStar: async (messageId, isStarred) => {
    try {
      await messageService.toggleStar(messageId, isStarred);
      
      set(state => ({
        messages: state.messages.map(m =>
          m.id === messageId ? { ...m, isStarred } : m
        ),
        currentMessage: state.currentMessage?.id === messageId
          ? { ...state.currentMessage, isStarred }
          : state.currentMessage
      }));
    } catch (error) {
      throw error;
    }
  },

  moveToFolder: async (messageIds, folder) => {
    try {
      await messageService.moveToFolder(messageIds, folder);
      
      set(state => ({
        messages: state.messages.filter(m => !messageIds.includes(m.id))
      }));
      
      get().fetchFolderCounts();
    } catch (error) {
      throw error;
    }
  },

  deleteMessages: async (messageIds) => {
    try {
      await messageService.deleteMessages(messageIds);
      
      set(state => ({
        messages: state.messages.filter(m => !messageIds.includes(m.id))
      }));
      
      get().fetchFolderCounts();
    } catch (error) {
      throw error;
    }
  },

  clearCurrentMessage: () => {
    set({ currentMessage: null });
  }
}));