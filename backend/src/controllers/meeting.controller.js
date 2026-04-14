const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { createNotification } = require('../services/notification.service');
const { sendEmail } = require('../services/email.service');
const { v4: uuidv4 } = require('uuid');

const { Meeting, MeetingParticipant, MeetingRecording, MeetingChat, User, Company } = db;

/**
 * Récupérer les réunions
 */
exports.getMeetings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      organizerId,
      type
    } = req.query;

    const where = {};

    if (req.user.isSystemAdmin) {
      // Admin système voit tout
    } else if (req.user.isCompanyAdmin) {
      where.companyId = req.user.companyId;
    } else {
      // Utilisateur standard voit ses réunions
      where[Op.or] = [
        { organizerId: req.user.id },
        { '$participants.userId$': req.user.id }
      ];
    }

    if (status) where.status = status;
    if (type) where.meetingType = type;
    if (organizerId) where.organizerId = organizerId;
    
    if (startDate && endDate) {
      where.startTime = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows: meetings } = await Meeting.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: MeetingParticipant,
          as: 'participants',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email']
          }]
        }
      ],
      order: [['startTime', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true,
      subQuery: false
    });

    res.json({
      success: true,
      data: {
        meetings,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération réunions:', error);
    next(error);
  }
};

/**
 * Récupérer les réunions à venir
 */
exports.getUpcomingMeetings = async (req, res, next) => {
  try {
    const where = {
      startTime: { [Op.gte]: new Date() },
      status: 'SCHEDULED'
    };

    if (!req.user.isSystemAdmin) {
      where[Op.or] = [
        { organizerId: req.user.id },
        { '$participants.userId$': req.user.id }
      ];
    }

    const meetings = await Meeting.findAll({
      where,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'fullName']
        },
        {
          model: MeetingParticipant,
          as: 'participants'
        }
      ],
      order: [['startTime', 'ASC']],
      limit: 10
    });

    res.json({
      success: true,
      data: meetings
    });

  } catch (error) {
    logger.error('Erreur récupération réunions à venir:', error);
    next(error);
  }
};

/**
 * Récupérer une réunion
 */
exports.getMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: MeetingParticipant,
          as: 'participants',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email']
          }]
        },
        {
          model: MeetingRecording,
          as: 'recordings'
        }
      ]
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Réunion non trouvée'
      });
    }

    // Vérifier l'accès
    const hasAccess = req.user.isSystemAdmin ||
                     req.user.isCompanyAdmin ||
                     meeting.organizerId === req.user.id ||
                     meeting.participants?.some(p => p.userId === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette réunion'
      });
    }

    res.json({
      success: true,
      data: meeting
    });

  } catch (error) {
    logger.error('Erreur récupération réunion:', error);
    next(error);
  }
};

/**
 * Créer une réunion
 */
exports.createMeeting = async (req, res, next) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      timezone = 'UTC',
      meetingType = 'VIDEO',
      participants = [],
      isRecurring = false,
      recurrencePattern,
      settings = {}
    } = req.body;

    // Générer le code et les liens
    const meetingCode = `MEET${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    let meetingUrl = null;
    let meetingIdExternal = null;
    let meetingPassword = null;

    if (meetingType === 'VIDEO' || meetingType === 'AUDIO') {
      meetingIdExternal = uuidv4().slice(0, 8);
      meetingPassword = Math.random().toString(36).slice(2, 8);
      meetingUrl = `${process.env.MEETING_BASE_URL || 'https://meet.logsys.com'}/${meetingIdExternal}`;
    }

    const meeting = await Meeting.create({
      meetingCode,
      title,
      description,
      organizerId: req.user.id,
      companyId: req.user.companyId,
      startTime,
      endTime,
      timezone,
      durationMinutes: (new Date(endTime) - new Date(startTime)) / 60000,
      isRecurring,
      recurrencePattern: recurrencePattern ? JSON.stringify(recurrencePattern) : null,
      meetingType,
      meetingUrl,
      meetingIdExternal,
      meetingPassword,
      enableWaitingRoom: settings.enableWaitingRoom !== false,
      allowChat: settings.allowChat !== false,
      allowRecording: settings.allowRecording || false,
      muteParticipantsOnEntry: settings.muteParticipantsOnEntry !== false,
      requireAuthentication: settings.requireAuthentication !== false,
      maxParticipants: settings.maxParticipants || 100,
      status: 'SCHEDULED',
      createdBy: req.user.id
    });

    // Ajouter les participants
    const participantRecords = [];

    // Ajouter l'organisateur
    participantRecords.push({
      meetingId: meeting.id,
      userId: req.user.id,
      role: 'ORGANIZER',
      responseStatus: 'ACCEPTED'
    });

    // Ajouter les autres participants
    for (const participant of participants) {
      const record = {
        meetingId: meeting.id,
        role: participant.role || 'ATTENDEE',
        responseStatus: 'PENDING'
      };

      if (participant.userId) {
        record.userId = participant.userId;
      } else if (participant.email) {
        record.externalEmail = participant.email;
        record.externalName = participant.name;
      }

      participantRecords.push(record);
    }

    await MeetingParticipant.bulkCreate(participantRecords);

    // Envoyer les invitations
    await sendMeetingInvitations(meeting, participants);

    // Créer des notifications
    for (const participant of participants) {
      if (participant.userId) {
        await createNotification({
          userId: participant.userId,
          type: 'MEETING_INVITATION',
          title: 'Invitation à une réunion',
          message: `${req.user.fullName} vous invite à la réunion "${title}"`,
          priority: 'NORMAL',
          actionUrl: `/meetings/${meeting.id}`,
          sourceType: 'MEETING',
          sourceId: meeting.id
        });
      }
    }

    res.status(201).json({
      success: true,
      data: meeting
    });

  } catch (error) {
    logger.error('Erreur création réunion:', error);
    next(error);
  }
};

/**
 * Mettre à jour une réunion
 */
exports.updateMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const meeting = await Meeting.findByPk(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Réunion non trouvée'
      });
    }

    // Vérifier les permissions
    const canUpdate = req.user.isSystemAdmin ||
                     req.user.isCompanyAdmin ||
                     meeting.organizerId === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour modifier cette réunion'
      });
    }

    const allowedFields = ['title', 'description', 'startTime', 'endTime', 
                          'meetingType', 'enableWaitingRoom', 'allowChat', 
                          'allowRecording', 'muteParticipantsOnEntry'];
    
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    if (updateData.startTime && updateData.endTime) {
      filteredData.durationMinutes = (new Date(updateData.endTime) - new Date(updateData.startTime)) / 60000;
    }

    await meeting.update(filteredData);

    // Notifier les participants du changement
    const participants = await MeetingParticipant.findAll({
      where: { meetingId: meeting.id, responseStatus: 'ACCEPTED' }
    });

    for (const p of participants) {
      if (p.userId && p.userId !== req.user.id) {
        await createNotification({
          userId: p.userId,
          type: 'MEETING_UPDATED',
          title: 'Réunion mise à jour',
          message: `La réunion "${meeting.title}" a été mise à jour`,
          priority: 'NORMAL',
          actionUrl: `/meetings/${meeting.id}`
        });
      }
    }

    res.json({
      success: true,
      data: meeting
    });

  } catch (error) {
    logger.error('Erreur mise à jour réunion:', error);
    next(error);
  }
};

/**
 * Supprimer une réunion
 */
exports.deleteMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findByPk(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Réunion non trouvée'
      });
    }

    const canDelete = req.user.isSystemAdmin || meeting.organizerId === req.user.id;
    
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    await meeting.destroy();
    
    res.json({
      success: true,
      message: 'Réunion supprimée'
    });

  } catch (error) {
    logger.error('Erreur suppression réunion:', error);
    next(error);
  }
};

/**
 * Annuler une réunion
 */
exports.cancelMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const meeting = await Meeting.findByPk(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Réunion non trouvée'
      });
    }

    const canCancel = req.user.isSystemAdmin ||
                     req.user.isCompanyAdmin ||
                     meeting.organizerId === req.user.id;

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour annuler cette réunion'
      });
    }

    await meeting.update({
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason
    });

    // Notifier les participants
    const participants = await MeetingParticipant.findAll({
      where: { meetingId: meeting.id }
    });

    for (const p of participants) {
      if (p.userId) {
        await createNotification({
          userId: p.userId,
          type: 'MEETING_CANCELLED',
          title: 'Réunion annulée',
          message: `La réunion "${meeting.title}" a été annulée${reason ? ` : ${reason}` : ''}`,
          priority: 'HIGH'
        });
      }
    }

    res.json({
      success: true,
      message: 'Réunion annulée avec succès'
    });

  } catch (error) {
    logger.error('Erreur annulation réunion:', error);
    next(error);
  }
};

/**
 * Rejoindre une réunion
 */
exports.joinMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findByPk(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Réunion non trouvée'
      });
    }

    if (meeting.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cette réunion a été annulée'
      });
    }

    // Vérifier l'accès
    const participant = await MeetingParticipant.findOne({
      where: {
        meetingId: id,
        [Op.or]: [
          { userId: req.user.id },
          { externalEmail: req.user.email }
        ]
      }
    });

    if (!participant && !req.user.isSystemAdmin && !req.user.isCompanyAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas invité à cette réunion'
      });
    }

    // Mettre à jour le statut de participation
    if (participant && participant.responseStatus === 'PENDING') {
      await participant.update({
        responseStatus: 'ACCEPTED',
        respondedAt: new Date()
      });
    }

    // Enregistrer l'heure de connexion
    if (participant) {
      await participant.update({
        joinedAt: new Date()
      });
    }

    // Mettre à jour le statut de la réunion
    if (meeting.status === 'SCHEDULED') {
      await meeting.update({ status: 'ONGOING' });
    }

    // Générer un token d'accès
    const accessToken = uuidv4();

    res.json({
      success: true,
      data: {
        meeting,
        accessToken,
        meetingUrl: meeting.meetingUrl,
        meetingId: meeting.meetingIdExternal,
        meetingPassword: meeting.meetingPassword
      }
    });

  } catch (error) {
    logger.error('Erreur connexion réunion:', error);
    next(error);
  }
};

/**
 * Quitter une réunion
 */
exports.leaveMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;

    const participant = await MeetingParticipant.findOne({
      where: {
        meetingId: id,
        userId: req.user.id
      }
    });

    if (participant) {
      const duration = participant.joinedAt 
        ? Math.floor((new Date() - participant.joinedAt) / 60000)
        : 0;

      await participant.update({
        leftAt: new Date(),
        actualDurationMinutes: duration
      });
    }

    // Vérifier s'il reste des participants
    const activeParticipants = await MeetingParticipant.count({
      where: {
        meetingId: id,
        leftAt: null,
        userId: { [Op.ne]: null }
      }
    });

    if (activeParticipants === 0) {
      await Meeting.update(
        { status: 'COMPLETED' },
        { where: { id } }
      );
    }

    res.json({
      success: true,
      message: 'Vous avez quitté la réunion'
    });

  } catch (error) {
    logger.error('Erreur départ réunion:', error);
    next(error);
  }
};

/**
 * Récupérer les participants
 */
exports.getParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;

    const participants = await MeetingParticipant.findAll({
      where: { meetingId: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'email']
      }]
    });

    res.json({
      success: true,
      data: participants
    });

  } catch (error) {
    logger.error('Erreur récupération participants:', error);
    next(error);
  }
};

/**
 * Ajouter un participant
 */
exports.addParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, email, name, role } = req.body;

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Réunion non trouvée'
      });
    }

    const participant = await MeetingParticipant.create({
      meetingId: id,
      userId,
      externalEmail: email,
      externalName: name,
      role: role || 'ATTENDEE',
      responseStatus: 'PENDING'
    });

    if (userId) {
      await createNotification({
        userId,
        type: 'MEETING_INVITATION',
        title: 'Invitation à une réunion',
        message: `Vous avez été invité à rejoindre la réunion "${meeting.title}"`,
        actionUrl: `/meetings/${id}`
      });
    }

    if (email) {
      await sendEmail({
        to: email,
        subject: `Invitation: ${meeting.title}`,
        template: 'meeting-invitation',
        data: {
          name: name || email,
          meetingTitle: meeting.title,
          startTime: meeting.startTime,
          meetingUrl: meeting.meetingUrl
        }
      });
    }

    res.status(201).json({
      success: true,
      data: participant
    });

  } catch (error) {
    logger.error('Erreur ajout participant:', error);
    next(error);
  }
};

/**
 * Retirer un participant
 */
exports.removeParticipant = async (req, res, next) => {
  try {
    const { id, participantId } = req.params;

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Réunion non trouvée'
      });
    }

    // Vérifier les permissions
    const canRemove = req.user.isSystemAdmin || meeting.organizerId === req.user.id;
    if (!canRemove) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    await MeetingParticipant.destroy({
      where: { id: participantId, meetingId: id }
    });

    res.json({
      success: true,
      message: 'Participant retiré'
    });

  } catch (error) {
    logger.error('Erreur suppression participant:', error);
    next(error);
  }
};

/**
 * Mettre à jour la réponse à une invitation
 */
exports.updateResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response, message } = req.body;

    const participant = await MeetingParticipant.findOne({
      where: {
        meetingId: id,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participation non trouvée'
      });
    }

    await participant.update({
      responseStatus: response,
      respondedAt: new Date(),
      responseMessage: message
    });

    // Notifier l'organisateur
    const meeting = await Meeting.findByPk(id);
    if (meeting && meeting.organizerId !== req.user.id) {
      await createNotification({
        userId: meeting.organizerId,
        type: 'MEETING_RESPONSE',
        title: 'Réponse à l\'invitation',
        message: `${req.user.fullName} a ${response === 'ACCEPTED' ? 'accepté' : 'décliné'} l'invitation à "${meeting.title}"`,
        priority: 'NORMAL'
      });
    }

    res.json({
      success: true,
      message: 'Réponse enregistrée'
    });

  } catch (error) {
    logger.error('Erreur mise à jour réponse:', error);
    next(error);
  }
};

/**
 * Envoyer un message dans le chat
 */
exports.sendChatMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, messageType = 'TEXT', recipientId, isPrivate = false } = req.body;

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Réunion non trouvée'
      });
    }

    const chatMessage = await MeetingChat.create({
      meetingId: id,
      userId: req.user.id,
      message,
      messageType,
      isPrivate,
      recipientId
    });

    res.json({
      success: true,
      data: chatMessage
    });

  } catch (error) {
    logger.error('Erreur envoi message chat:', error);
    next(error);
  }
};

/**
 * Récupérer les messages du chat
 */
exports.getChatMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;

    const where = { meetingId: id };
    
    if (before) {
      where.sentAt = { [Op.lt]: new Date(before) };
    }

    // Filtrer les messages privés
    where[Op.or] = [
      { isPrivate: false },
      { userId: req.user.id },
      { recipientId: req.user.id }
    ];

    const messages = await MeetingChat.findAll({
      where,
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'fullName']
      }],
      order: [['sentAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: messages.reverse()
    });

  } catch (error) {
    logger.error('Erreur récupération messages chat:', error);
    next(error);
  }
};

/**
 * Démarrer l'enregistrement
 */
exports.startRecording = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findByPk(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Réunion non trouvée'
      });
    }

    if (!meeting.allowRecording) {
      return res.status(400).json({
        success: false,
        message: 'L\'enregistrement n\'est pas autorisé pour cette réunion'
      });
    }

    const recording = await MeetingRecording.create({
      meetingId: id,
      recordingUrl: '',
      processingStatus: 'PENDING',
      createdBy: req.user.id
    });

    res.json({
      success: true,
      data: recording
    });

  } catch (error) {
    logger.error('Erreur démarrage enregistrement:', error);
    next(error);
  }
};

/**
 * Arrêter l'enregistrement
 */
exports.stopRecording = async (req, res, next) => {
  try {
    const { id, recordingId } = req.params;

    const recording = await MeetingRecording.findOne({
      where: {
        id: recordingId,
        meetingId: id
      }
    });

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Enregistrement non trouvé'
      });
    }

    const recordingUrl = `/uploads/recordings/${id}/${recordingId}.mp4`;

    await recording.update({
      recordingUrl,
      processingStatus: 'COMPLETED',
      processedAt: new Date(),
      durationSeconds: 3600,
      fileSizeBytes: 100 * 1024 * 1024
    });

    res.json({
      success: true,
      data: recording
    });

  } catch (error) {
    logger.error('Erreur arrêt enregistrement:', error);
    next(error);
  }
};

/**
 * Récupérer les enregistrements
 */
exports.getRecordings = async (req, res, next) => {
  try {
    const { id } = req.params;

    const recordings = await MeetingRecording.findAll({
      where: { meetingId: id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: recordings
    });

  } catch (error) {
    logger.error('Erreur récupération enregistrements:', error);
    next(error);
  }
};

// Fonction helper pour envoyer les invitations
async function sendMeetingInvitations(meeting, participants) {
  for (const participant of participants) {
    const email = participant.email || participant.externalEmail;
    const name = participant.name || participant.externalName;

    if (email) {
      await sendEmail({
        to: email,
        subject: `Invitation: ${meeting.title}`,
        template: 'meeting-invitation',
        data: {
          name: name || email,
          meetingTitle: meeting.title,
          meetingDescription: meeting.description,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          meetingUrl: meeting.meetingUrl,
          organizerName: meeting.organizer?.fullName
        }
      }).catch(err => logger.error('Erreur envoi invitation:', err));
    }
  }
}