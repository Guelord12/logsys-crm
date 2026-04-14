const { redisClient, redisSubscriber } = require('../config/redis');
const logger = require('../utils/logger');
const { verify } = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../models');

const connectedUsers = new Map();
const userSockets = new Map();
const meetingRooms = new Map();

/**
 * Initialiser Socket.IO
 */
const initializeSocket = (io) => {
  
  // Middleware d'authentification
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      // En développement, permettre connexion sans token
      if (!token && process.env.NODE_ENV === 'development') {
        socket.user = { 
          id: 'dev-user', 
          email: 'dev@logsys.com', 
          fullName: 'Dev User',
          companyId: null,
          isSystemAdmin: true,
          isCompanyAdmin: false
        };
        logger.info(`Socket connecté (dev): ${socket.user.id}`);
        return next();
      }
      
      if (!token) {
        logger.warn('Socket: Token manquant');
        return next(new Error('Authentification requise'));
      }
      
      let decoded;
      try {
        decoded = verify(token, config.jwt.secret);
      } catch (jwtError) {
        logger.warn('Socket: Token JWT invalide:', jwtError.message);
        if (process.env.NODE_ENV === 'development') {
          socket.user = { 
            id: 'dev-user', 
            email: 'dev@logsys.com', 
            fullName: 'Dev User',
            companyId: null,
            isSystemAdmin: true,
            isCompanyAdmin: false
          };
          return next();
        }
        return next(new Error('Token invalide'));
      }
      
      const user = await db.User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'fullName', 'companyId', 'isSystemAdmin', 'isCompanyAdmin']
      });
      
      if (!user) {
        logger.warn(`Socket: Utilisateur non trouvé - ID: ${decoded.id}`);
        if (process.env.NODE_ENV === 'development') {
          socket.user = { 
            id: decoded.id || 'dev-user', 
            email: decoded.email || 'dev@logsys.com', 
            fullName: 'Dev User',
            companyId: null,
            isSystemAdmin: true,
            isCompanyAdmin: false
          };
          return next();
        }
        return next(new Error('Utilisateur non trouvé'));
      }
      
      socket.user = user;
      logger.info(`Socket authentifié: ${user.id} - ${user.email}`);
      next();
      
    } catch (error) {
      logger.error('Erreur authentification socket:', error);
      if (process.env.NODE_ENV === 'development') {
        socket.user = { 
          id: 'dev-user', 
          email: 'dev@logsys.com', 
          fullName: 'Dev User',
          companyId: null,
          isSystemAdmin: true,
          isCompanyAdmin: false
        };
        return next();
      }
      next(new Error('Erreur d\'authentification'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    
    logger.info(`Socket connecté: ${user.id} - ${user.email}`);
    
    // Ajouter aux maps
    connectedUsers.set(user.id, {
      socketId: socket.id,
      user,
      connectedAt: new Date()
    });
    
    if (!userSockets.has(user.id)) {
      userSockets.set(user.id, new Set());
    }
    userSockets.get(user.id).add(socket.id);
    
    // Rejoindre les rooms personnelles
    socket.join(`user:${user.id}`);
    
    if (user.companyId) {
      socket.join(`company:${user.companyId}`);
    }
    
    if (user.isSystemAdmin) {
      socket.join('admin:system');
    }
    
    // Informer les autres utilisateurs
    socket.broadcast.emit('user:online', {
      userId: user.id,
      name: user.fullName,
      companyId: user.companyId,
      timestamp: new Date()
    });
    
    // === Événements ===
    
    // Présence
    socket.on('presence:status', (data) => {
      socket.broadcast.emit('presence:update', {
        userId: user.id,
        status: data.status,
        timestamp: new Date()
      });
    });
    
    // Messages
    socket.on('message:typing', (data) => {
      socket.to(`user:${data.recipientId}`).emit('message:typing', {
        userId: user.id,
        name: user.fullName,
        conversationId: data.conversationId
      });
    });
    
    socket.on('message:read', (data) => {
      socket.to(`user:${data.senderId}`).emit('message:read', {
        messageIds: data.messageIds,
        readBy: user.id,
        timestamp: new Date()
      });
    });
    
    // Réunions
    socket.on('meeting:join', async (data) => {
      const { meetingId } = data;
      
      socket.join(`meeting:${meetingId}`);
      
      if (!meetingRooms.has(meetingId)) {
        meetingRooms.set(meetingId, new Set());
      }
      meetingRooms.get(meetingId).add(user.id);
      
      socket.to(`meeting:${meetingId}`).emit('meeting:participant:joined', {
        userId: user.id,
        name: user.fullName,
        timestamp: new Date()
      });
      
      const participants = Array.from(meetingRooms.get(meetingId) || []);
      socket.emit('meeting:participants', { participants });
      
      logger.info(`Utilisateur ${user.id} a rejoint la réunion ${meetingId}`);
    });
    
    socket.on('meeting:leave', (data) => {
      const { meetingId } = data;
      
      socket.leave(`meeting:${meetingId}`);
      
      if (meetingRooms.has(meetingId)) {
        meetingRooms.get(meetingId).delete(user.id);
      }
      
      socket.to(`meeting:${meetingId}`).emit('meeting:participant:left', {
        userId: user.id,
        name: user.fullName,
        timestamp: new Date()
      });
    });
    
    // WebRTC Signaling
    socket.on('meeting:signal', (data) => {
      if (data.to) {
        socket.to(`user:${data.to}`).emit('meeting:signal', {
          from: user.id,
          signal: data.signal
        });
      } else {
        socket.to(`meeting:${data.meetingId}`).emit('meeting:signal', {
          from: user.id,
          signal: data.signal
        });
      }
    });
    
    // Chat de réunion
    socket.on('meeting:chat', (data) => {
      io.to(`meeting:${data.meetingId}`).emit('meeting:chat:message', {
        id: Date.now(),
        userId: user.id,
        userName: user.fullName,
        message: data.message,
        timestamp: new Date()
      });
    });
    
    // Audio/Video controls
    socket.on('meeting:mute', (data) => {
      socket.to(`meeting:${data.meetingId}`).emit('meeting:participant:muted', {
        userId: user.id,
        muted: data.muted
      });
    });
    
    socket.on('meeting:video', (data) => {
      socket.to(`meeting:${data.meetingId}`).emit('meeting:participant:video', {
        userId: user.id,
        videoEnabled: data.videoEnabled
      });
    });
    
    socket.on('meeting:raise-hand', (data) => {
      socket.to(`meeting:${data.meetingId}`).emit('meeting:hand-raised', {
        userId: user.id,
        name: user.fullName
      });
    });
    
    socket.on('meeting:screen-share', (data) => {
      socket.to(`meeting:${data.meetingId}`).emit('meeting:screen-share', {
        userId: user.id,
        sharing: data.sharing
      });
    });
    
    // Notifications
    socket.on('notification:subscribe', () => {
      socket.join(`notifications:${user.id}`);
      logger.debug(`Utilisateur ${user.id} abonné aux notifications`);
    });
    
    socket.on('notification:unsubscribe', () => {
      socket.leave(`notifications:${user.id}`);
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
      logger.info(`Socket déconnecté: ${user.id}`);
      
      if (userSockets.has(user.id)) {
        userSockets.get(user.id).delete(socket.id);
        if (userSockets.get(user.id).size === 0) {
          userSockets.delete(user.id);
          connectedUsers.delete(user.id);
        }
      }
      
      meetingRooms.forEach((participants, meetingId) => {
        if (participants.has(user.id)) {
          participants.delete(user.id);
          io.to(`meeting:${meetingId}`).emit('meeting:participant:left', {
            userId: user.id,
            name: user.fullName,
            timestamp: new Date()
          });
        }
      });
      
      socket.broadcast.emit('user:offline', {
        userId: user.id,
        name: user.fullName,
        timestamp: new Date()
      });
    });
  });
  
  // Écouter les notifications Redis (si Redis est configuré)
  if (redisSubscriber) {
    redisSubscriber.subscribe('notifications', (err) => {
      if (err) {
        logger.error('Erreur subscription Redis:', err);
      } else {
        logger.info('✅ Abonné au canal Redis: notifications');
      }
    });
    
    redisSubscriber.on('message', (channel, message) => {
      if (channel === 'notifications') {
        try {
          const data = JSON.parse(message);
          io.to(`notifications:${data.userId}`).emit('notification:new', data.notification);
        } catch (error) {
          logger.error('Erreur parsing notification:', error);
        }
      }
    });
  }
  
  logger.info('✅ Socket.IO initialisé');
  
  return io;
};

/**
 * Envoyer une notification à un utilisateur
 */
const sendToUser = (io, userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Envoyer à tous les utilisateurs d'une entreprise
 */
const sendToCompany = (io, companyId, event, data) => {
  if (!io) return;
  io.to(`company:${companyId}`).emit(event, data);
};

/**
 * Envoyer à tous les admins système
 */
const sendToSystemAdmins = (io, event, data) => {
  if (!io) return;
  io.to('admin:system').emit(event, data);
};

/**
 * Obtenir les utilisateurs connectés
 */
const getConnectedUsers = () => {
  const users = [];
  connectedUsers.forEach((value, key) => {
    users.push({
      userId: key,
      email: value.user.email,
      fullName: value.user.fullName,
      connectedAt: value.connectedAt
    });
  });
  return users;
};

/**
 * Vérifier si un utilisateur est connecté
 */
const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

/**
 * Obtenir les participants d'une réunion
 */
const getMeetingParticipants = (meetingId) => {
  return Array.from(meetingRooms.get(meetingId) || []);
};

module.exports = {
  initializeSocket,
  sendToUser,
  sendToCompany,
  sendToSystemAdmins,
  getConnectedUsers,
  isUserConnected,
  getMeetingParticipants
};