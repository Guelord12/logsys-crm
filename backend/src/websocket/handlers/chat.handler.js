const db = require('../../models');
const logger = require('../../utils/logger');

const handleChatMessage = async (io, socket, data) => {
  try {
    const { meetingId, message, messageType, recipientId, isPrivate } = data;
    
    const chatMessage = await db.MeetingChat.create({
      meetingId,
      userId: socket.user.id,
      message,
      messageType: messageType || 'TEXT',
      isPrivate: isPrivate || false,
      recipientId
    });

    const messageData = {
      id: chatMessage.id,
      meetingId,
      userId: socket.user.id,
      userName: socket.user.fullName,
      message,
      messageType,
      isPrivate,
      sentAt: chatMessage.sentAt
    };

    if (isPrivate && recipientId) {
      io.to(`user:${recipientId}`).emit('meeting:chat:private', messageData);
      socket.emit('meeting:chat:private', messageData);
    } else {
      io.to(`meeting:${meetingId}`).emit('meeting:chat:message', messageData);
    }

  } catch (error) {
    logger.error('Erreur handler chat:', error);
  }
};

const handleTyping = (io, socket, data) => {
  const { meetingId, isTyping } = data;
  
  socket.to(`meeting:${meetingId}`).emit('meeting:chat:typing', {
    userId: socket.user.id,
    userName: socket.user.fullName,
    isTyping
  });
};

module.exports = {
  handleChatMessage,
  handleTyping
};