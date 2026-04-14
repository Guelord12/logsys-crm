const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const generateMeetingLink = async (options) => {
  const { title, startTime, duration } = options;
  
  const meetingId = uuidv4().slice(0, 8);
  const password = Math.random().toString(36).slice(2, 8);
  
  const baseUrl = process.env.MEETING_BASE_URL || 'https://meet.logsys.com';
  const url = `${baseUrl}/${meetingId}`;
  
  return {
    url,
    meetingId,
    password,
    platform: 'LOGSYS_MEET'
  };
};

const createMeetingRoom = async (meeting) => {
  return {
    roomId: meeting.meetingCode,
    config: {
      enableWaitingRoom: meeting.enableWaitingRoom,
      allowChat: meeting.allowChat,
      allowRecording: meeting.allowRecording,
      muteParticipantsOnEntry: meeting.muteParticipantsOnEntry,
      maxParticipants: meeting.maxParticipants
    }
  };
};

const generateRecordingUrl = async (meetingId, recordingId) => {
  return `https://storage.logsys.com/recordings/${meetingId}/${recordingId}.mp4`;
};

const processRecording = async (recordingId, filePath) => {
  logger.info(`Traitement enregistrement ${recordingId}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        url: `https://storage.logsys.com/recordings/${recordingId}.mp4`,
        duration: 3600,
        size: 100 * 1024 * 1024
      });
    }, 5000);
  });
};

module.exports = {
  generateMeetingLink,
  createMeetingRoom,
  generateRecordingUrl,
  processRecording
};