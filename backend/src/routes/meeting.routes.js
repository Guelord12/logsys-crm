const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Meetings
 *   description: Gestion des réunions et visioconférences
 */

// Réunions
router.get('/', meetingController.getMeetings);
router.get('/upcoming', meetingController.getUpcomingMeetings);
router.get('/:id', meetingController.getMeeting);
router.post('/', validate(schemas.createMeeting), meetingController.createMeeting);
router.put('/:id', meetingController.updateMeeting);
router.delete('/:id', meetingController.deleteMeeting);
router.post('/:id/cancel', meetingController.cancelMeeting);

// Participation
router.post('/:id/join', meetingController.joinMeeting);
router.post('/:id/leave', meetingController.leaveMeeting);
router.get('/:id/participants', meetingController.getParticipants);
router.post('/:id/participants', meetingController.addParticipant);
router.delete('/:id/participants/:participantId', meetingController.removeParticipant);
router.post('/:id/respond', meetingController.updateResponse);

// Chat
router.get('/:id/chat', meetingController.getChatMessages);
router.post('/:id/chat', meetingController.sendChatMessage);

// Enregistrement
router.post('/:id/recording/start', meetingController.startRecording);
router.post('/:id/recording/:recordingId/stop', meetingController.stopRecording);
router.get('/:id/recordings', meetingController.getRecordings);

module.exports = router;