const db = require('../../models');
const logger = require('../../utils/logger');

const handleJoinMeeting = async (io, socket, data) => {
  try {
    const { meetingId } = data;
    
    socket.join(`meeting:${meetingId}`);
    
    const participant = await db.MeetingParticipant.findOne({
      where: { meetingId, userId: socket.user.id }
    });

    if (participant) {
      await participant.update({
        joinedAt: new Date(),
        responseStatus: 'ACCEPTED'
      });
    }

    const participants = await db.MeetingParticipant.findAll({
      where: { meetingId },
      include: [{ model: db.User, as: 'user', attributes: ['id', 'fullName', 'email'] }]
    });

    socket.emit('meeting:participants', { 
      participants: participants.map(p => ({
        id: p.user?.id || p.id,
        name: p.user?.fullName || p.externalName,
        email: p.user?.email || p.externalEmail,
        role: p.role,
        joinedAt: p.joinedAt
      }))
    });

    socket.to(`meeting:${meetingId}`).emit('meeting:participant:joined', {
      userId: socket.user.id,
      name: socket.user.fullName,
      timestamp: new Date()
    });

    logger.info(`Utilisateur ${socket.user.id} a rejoint la réunion ${meetingId}`);

  } catch (error) {
    logger.error('Erreur join meeting:', error);
  }
};

const handleLeaveMeeting = async (io, socket, data) => {
  try {
    const { meetingId } = data;
    
    socket.leave(`meeting:${meetingId}`);

    const participant = await db.MeetingParticipant.findOne({
      where: { meetingId, userId: socket.user.id }
    });

    if (participant && participant.joinedAt) {
      const duration = Math.floor((new Date() - participant.joinedAt) / 60000);
      await participant.update({
        leftAt: new Date(),
        actualDurationMinutes: duration
      });
    }

    socket.to(`meeting:${meetingId}`).emit('meeting:participant:left', {
      userId: socket.user.id,
      name: socket.user.fullName,
      timestamp: new Date()
    });

    logger.info(`Utilisateur ${socket.user.id} a quitté la réunion ${meetingId}`);

  } catch (error) {
    logger.error('Erreur leave meeting:', error);
  }
};

const handleSignal = (io, socket, data) => {
  const { meetingId, signal, to } = data;
  
  if (to) {
    io.to(`user:${to}`).emit('meeting:signal', {
      from: socket.user.id,
      signal
    });
  } else {
    socket.to(`meeting:${meetingId}`).emit('meeting:signal', {
      from: socket.user.id,
      signal
    });
  }
};

const handleMuteToggle = (io, socket, data) => {
  const { meetingId, muted } = data;
  
  socket.to(`meeting:${meetingId}`).emit('meeting:participant:muted', {
    userId: socket.user.id,
    muted
  });
};

const handleVideoToggle = (io, socket, data) => {
  const { meetingId, videoEnabled } = data;
  
  socket.to(`meeting:${meetingId}`).emit('meeting:participant:video', {
    userId: socket.user.id,
    videoEnabled
  });
};

const handleScreenShare = (io, socket, data) => {
  const { meetingId, sharing } = data;
  
  socket.to(`meeting:${meetingId}`).emit('meeting:screen-share', {
    userId: socket.user.id,
    sharing
  });
};

const handleRaiseHand = (io, socket, data) => {
  const { meetingId } = data;
  
  socket.to(`meeting:${meetingId}`).emit('meeting:hand-raised', {
    userId: socket.user.id,
    name: socket.user.fullName
  });
};

module.exports = {
  handleJoinMeeting,
  handleLeaveMeeting,
  handleSignal,
  handleMuteToggle,
  handleVideoToggle,
  handleScreenShare,
  handleRaiseHand
};