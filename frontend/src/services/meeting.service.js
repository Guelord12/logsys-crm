import apiService from './api.service';

const meetingService = {
  getMeetings: (params) => apiService.get('/meetings', { params }),
  getMeeting: (id) => apiService.get(`/meetings/${id}`),
  createMeeting: (data) => apiService.post('/meetings', data),
  updateMeeting: (id, data) => apiService.put(`/meetings/${id}`, data),
  cancelMeeting: (id, reason) => apiService.post(`/meetings/${id}/cancel`, { reason }),
  deleteMeeting: (id) => apiService.delete(`/meetings/${id}`),
  joinMeeting: (id) => apiService.post(`/meetings/${id}/join`),
  leaveMeeting: (id) => apiService.post(`/meetings/${id}/leave`),
  getParticipants: (id) => apiService.get(`/meetings/${id}/participants`),
  addParticipant: (id, data) => apiService.post(`/meetings/${id}/participants`, data),
  removeParticipant: (meetingId, participantId) => 
    apiService.delete(`/meetings/${meetingId}/participants/${participantId}`),
  updateResponse: (id, response) => apiService.post(`/meetings/${id}/respond`, { response }),
  startRecording: (id) => apiService.post(`/meetings/${id}/recording/start`),
  stopRecording: (id, recordingId) => apiService.post(`/meetings/${id}/recording/${recordingId}/stop`),
  getRecordings: (id) => apiService.get(`/meetings/${id}/recordings`),
  sendChatMessage: (id, message) => apiService.post(`/meetings/${id}/chat`, message),
  getChatMessages: (id, params) => apiService.get(`/meetings/${id}/chat`, { params }),
  getUpcomingMeetings: () => apiService.get('/meetings/upcoming')
};

export { meetingService };