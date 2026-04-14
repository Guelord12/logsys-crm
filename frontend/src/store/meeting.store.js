import { create } from 'zustand';
import { meetingService } from '@services/meeting.service';

export const useMeetingStore = create((set, get) => ({
  meetings: [],
  currentMeeting: null,
  participants: [],
  chatMessages: [],
  isLoading: false,
  pagination: null,

  fetchMeetings: async (params = {}) => {
    set({ isLoading: true });
    
    try {
      const response = await meetingService.getMeetings(params);
      
      set({
        meetings: response.data.data.meetings,
        pagination: response.data.data.pagination,
        isLoading: false
      });
      
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchMeeting: async (id) => {
    try {
      const response = await meetingService.getMeeting(id);
      set({ currentMeeting: response.data.data });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createMeeting: async (data) => {
    try {
      const response = await meetingService.createMeeting(data);
      
      set(state => ({
        meetings: [response.data.data, ...state.meetings]
      }));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMeeting: async (id, data) => {
    try {
      const response = await meetingService.updateMeeting(id, data);
      
      set(state => ({
        meetings: state.meetings.map(m => m.id === id ? response.data.data : m),
        currentMeeting: state.currentMeeting?.id === id ? response.data.data : state.currentMeeting
      }));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  cancelMeeting: async (id, reason) => {
    try {
      await meetingService.cancelMeeting(id, reason);
      
      set(state => ({
        meetings: state.meetings.map(m => 
          m.id === id ? { ...m, status: 'CANCELLED' } : m
        ),
        currentMeeting: state.currentMeeting?.id === id
          ? { ...state.currentMeeting, status: 'CANCELLED' }
          : state.currentMeeting
      }));
    } catch (error) {
      throw error;
    }
  },

  joinMeeting: async (id) => {
    try {
      const response = await meetingService.joinMeeting(id);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  fetchParticipants: async (id) => {
    try {
      const response = await meetingService.getParticipants(id);
      set({ participants: response.data.data });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addParticipant: (participant) => {
    set(state => ({
      participants: [...state.participants, participant]
    }));
  },

  removeParticipant: (participantId) => {
    set(state => ({
      participants: state.participants.filter(p => p.id !== participantId)
    }));
  },

  addChatMessage: (message) => {
    set(state => ({
      chatMessages: [...state.chatMessages, message]
    }));
  },

  setMeetingStatus: (meetingId, status) => {
    set(state => ({
      meetings: state.meetings.map(m =>
        m.id === meetingId ? { ...m, status } : m
      ),
      currentMeeting: state.currentMeeting?.id === meetingId
        ? { ...state.currentMeeting, status }
        : state.currentMeeting
    }));
  },

  clearCurrentMeeting: () => {
    set({ 
      currentMeeting: null, 
      participants: [], 
      chatMessages: [] 
    });
  }
}));