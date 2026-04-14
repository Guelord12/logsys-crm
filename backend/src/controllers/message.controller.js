const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const { uploadToStorage, deleteFromStorage } = require('../services/storage.service');
const fs = require('fs-extra');
const path = require('path');

const { Message, MessageRecipient, Attachment, User, EmailFolder, sequelize } = db;

/**
 * Récupérer les dossiers de l'utilisateur
 */
exports.getFolders = async (req, res, next) => {
  try {
    const folders = await EmailFolder.findAll({
      where: { userId: req.user.id },
      order: [['folderType', 'ASC'], ['folderName', 'ASC']]
    });

    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des dossiers:', error);
    next(error);
  }
};

/**
 * Récupérer les compteurs des dossiers
 */
exports.getFolderCounts = async (req, res, next) => {
  try {
    const result = {
      inbox: 0,
      unread: 0,
      sent: 0,
      drafts: 0,
      starred: 0,
      archive: 0,
      trash: 0,
      spam: 0
    };

    // Requête SQL brute - utilise snake_case
    const counts = await sequelize.query(`
      SELECT 
        COALESCE(ef.folder_type, 'INBOX') as folder_type,
        COUNT(mr.id) as count,
        SUM(CASE WHEN mr.is_read = false THEN 1 ELSE 0 END) as unread
      FROM message_recipients mr
      LEFT JOIN email_folders ef ON mr.folder_id = ef.id
      WHERE mr.recipient_id = :userId
        AND mr.is_archived = false
        AND mr.is_deleted = false
      GROUP BY ef.folder_type
    `, {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.SELECT
    }).catch(() => []);

    counts.forEach(item => {
      const type = item.folder_type?.toLowerCase();
      if (type && result[type] !== undefined) {
        result[type] = parseInt(item.count) || 0;
        if (type === 'inbox') {
          result.unread = parseInt(item.unread) || 0;
        }
      }
    });

    // Requête SQL brute - utilise snake_case
    const draftsResult = await sequelize.query(`
      SELECT COUNT(*) as count FROM messages 
      WHERE sender_id = :userId AND status = 'DRAFT'
    `, {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.SELECT
    }).catch(() => [{ count: 0 }]);
    result.drafts = parseInt(draftsResult[0]?.count) || 0;

    // Requête SQL brute - utilise snake_case
    const starredResult = await sequelize.query(`
      SELECT COUNT(*) as count FROM message_recipients 
      WHERE recipient_id = :userId AND is_starred = true AND is_deleted = false
    `, {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.SELECT
    }).catch(() => [{ count: 0 }]);
    result.starred = parseInt(starredResult[0]?.count) || 0;

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des compteurs:', error);
    res.json({
      success: true,
      data: {
        inbox: 0, unread: 0, sent: 0, drafts: 0,
        starred: 0, archive: 0, trash: 0, spam: 0
      }
    });
  }
};

/**
 * Récupérer les messages d'un dossier
 */
exports.getMessages = async (req, res, next) => {
  try {
    const {
      folder = 'INBOX',
      page = 1,
      limit = 20,
      search,
      isStarred,
      hasAttachments
    } = req.query;

    // Trouver le dossier - utilise camelCase
    let folderRecord = await EmailFolder.findOne({
      where: {
        userId: req.user.id,
        folderType: folder
      }
    });

    if (!folderRecord && folder !== 'STARRED' && folder !== 'DRAFTS') {
      folderRecord = await EmailFolder.create({
        userId: req.user.id,
        folderName: folder.charAt(0) + folder.slice(1).toLowerCase(),
        folderType: folder,
        isSystem: true
      });
    }

    // where pour MessageRecipient - utilise camelCase
    const where = {
      recipientId: req.user.id,
      isDeleted: folder === 'TRASH'
    };

    if (folder !== 'TRASH') {
      where.isDeleted = false;
    }

    if (folder === 'INBOX' || folder === 'SENT') {
      where.folderId = folderRecord?.id;
    } else if (folder === 'STARRED') {
      where.isStarred = true;
      where.isDeleted = false;
    } else if (folder === 'ARCHIVE') {
      where.isArchived = true;
      where.isDeleted = false;
    } else if (folderRecord) {
      where.folderId = folderRecord.id;
    }

    if (isStarred === 'true') {
      where.isStarred = true;
    }

    // where pour Message - utilise camelCase
    const messageWhere = {};
    if (search) {
      messageWhere[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } },
        { bodyText: { [Op.iLike]: `%${search}%` } },
        { senderName: { [Op.iLike]: `%${search}%` } },
        { senderEmail: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (hasAttachments === 'true') {
      messageWhere.hasAttachments = true;
    }

    // Gérer les brouillons séparément - utilise camelCase
    if (folder === 'DRAFTS') {
      const { count, rows: drafts } = await Message.findAndCountAll({
        where: {
          senderId: req.user.id,
          status: 'DRAFT',
          ...messageWhere
        },
        include: [{
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'filename', 'fileSize', 'mimeType']
        }],
        order: [['updatedAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        distinct: true
      });

      const messages = drafts.map(draft => ({
        id: draft.id,
        subject: draft.subject,
        snippet: draft.snippet,
        hasAttachments: draft.hasAttachments,
        updatedAt: draft.updatedAt,
        status: 'DRAFT',
        isRead: true,
        isStarred: false
      }));

      return res.json({
        success: true,
        data: {
          messages,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    }

    // Messages normaux - utilise camelCase
    const { count, rows } = await MessageRecipient.findAndCountAll({
      where,
      include: [
        {
          model: Message,
          as: 'message',
          where: messageWhere,
          include: [{
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'filename', 'fileSize', 'mimeType']
          }]
        },
        {
          model: EmailFolder,
          as: 'folder',
          attributes: ['id', 'folderName', 'folderType', 'color', 'icon']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    const messages = rows
      .filter(recipient => recipient.message)
      .map(recipient => ({
        id: recipient.message.id,
        recipientId: recipient.id,
        subject: recipient.message.subject,
        snippet: recipient.message.snippet,
        senderName: recipient.message.senderName,
        senderEmail: recipient.message.senderEmail,
        receivedAt: recipient.message.receivedAt,
        sentAt: recipient.message.sentAt,
        isRead: recipient.isRead,
        isStarred: recipient.isStarred,
        hasAttachments: recipient.message.hasAttachments,
        folder: recipient.folder,
        labels: recipient.labels
      }));

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des messages:', error);
    next(error);
  }
};

/**
 * Récupérer un message par ID
 */
exports.getMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id, {
      include: [
        { model: Attachment, as: 'attachments' },
        {
          model: MessageRecipient,
          as: 'recipients',
          include: [{ model: User, as: 'recipient', attributes: ['id', 'fullName', 'email'] }]
        }
      ]
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message non trouvé' });
    }

    const isSender = message.senderId === req.user.id;
    const isRecipient = message.recipients?.some(r => r.recipientId === req.user.id);

    if (!isSender && !isRecipient && !req.user.isSystemAdmin) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé à ce message' });
    }

    if (isRecipient) {
      const recipient = await MessageRecipient.findOne({
        where: { messageId: message.id, recipientId: req.user.id }
      });

      if (recipient && !recipient.isRead) {
        await recipient.update({ isRead: true, readAt: new Date() });
      }
    }

    res.json({ success: true, data: message });

  } catch (error) {
    logger.error('Erreur lors de la récupération du message:', error);
    next(error);
  }
};

/**
 * Envoyer un message
 */
exports.sendMessage = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      subject,
      body,
      bodyHtml,
      recipients,
      attachments: attachmentIds,
      scheduledFor,
      importance = 'NORMAL'
    } = req.body;

    if (!recipients || recipients.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Au moins un destinataire est requis' });
    }

    // Valeurs par défaut
    const senderEmail = req.user?.email || req.user?.username || 'system@logsys.local';
    const senderName = req.user?.fullName || req.user?.full_name || req.user?.username || req.user?.email || 'Utilisateur LogSys';

    // ✅ Création du message - utilise camelCase
    const message = await Message.create({
      subject: subject || '(Sans objet)',
      bodyText: body || '',
      bodyHtml: bodyHtml || body || '',
      snippet: (body || '').substring(0, 200),
      senderId: req.user.id,
      senderEmail: senderEmail,
      senderName: senderName,
      importance: importance || 'NORMAL',
      hasAttachments: attachmentIds?.length > 0 || false,
      status: scheduledFor ? 'SCHEDULED' : 'SENT',
      scheduledFor: scheduledFor || null,
      sentAt: scheduledFor ? null : new Date()
    }, { transaction });

    if (attachmentIds?.length > 0) {
      await Attachment.update(
        { messageId: message.id },
        { where: { id: attachmentIds }, transaction }
      );
    }

    const recipientPromises = [];

    for (const recipient of recipients) {
      let recipientUser = await User.findOne({ where: { email: recipient.email } });

      let inboxFolder = null;
      if (recipientUser) {
        inboxFolder = await EmailFolder.findOne({
          where: { userId: recipientUser.id, folderType: 'INBOX' }
        });

        if (!inboxFolder) {
          inboxFolder = await EmailFolder.create({
            userId: recipientUser.id,
            folderName: 'Inbox',
            folderType: 'INBOX',
            isSystem: true
          }, { transaction });
        }
      }

      recipientPromises.push(
        MessageRecipient.create({
          messageId: message.id,
          recipientId: recipientUser?.id,
          recipientEmail: recipient.email,
          recipientName: recipient.name || recipient.email,
          recipientType: recipient.type || 'TO',
          folderId: inboxFolder?.id
        }, { transaction })
      );

      if (recipientUser && !scheduledFor) {
        await createNotification({
          userId: recipientUser.id,
          type: 'MESSAGE_RECEIVED',
          title: 'Nouveau message',
          message: `${senderName} vous a envoyé un message: ${subject || '(Sans objet)'}`,
          priority: 'NORMAL',
          actionUrl: `/messages/${message.id}`,
          sourceType: 'MESSAGE',
          sourceId: message.id
        });
      }
    }

    await Promise.all(recipientPromises);

    let sentFolder = await EmailFolder.findOne({
      where: { userId: req.user.id, folderType: 'SENT' }
    });

    if (!sentFolder) {
      sentFolder = await EmailFolder.create({
        userId: req.user.id,
        folderName: 'Envoyés',
        folderType: 'SENT',
        isSystem: true
      }, { transaction });
    }

    await MessageRecipient.create({
      messageId: message.id,
      recipientId: req.user.id,
      recipientEmail: senderEmail,
      recipientName: senderName,
      recipientType: 'FROM',
      folderId: sentFolder.id,
      isRead: true,
      readAt: new Date()
    }, { transaction });

    await transaction.commit();

    // ✅ AJOUT : Envoi d'email aux destinataires externes AVEC pièces jointes
    if (!scheduledFor) {
      const externalRecipients = recipients.filter(r => !r.userId && !r.recipientId);
      if (externalRecipients.length > 0) {
        // Récupérer les pièces jointes du message
        const attachments = await Attachment.findAll({
          where: { messageId: message.id }
        });
        
        // Préparer les pièces jointes pour l'email
        const emailAttachments = [];
        for (const att of attachments) {
          if (await fs.pathExists(att.storagePath)) {
            emailAttachments.push({
              filename: att.originalFilename,
              path: att.storagePath,
              contentType: att.mimeType
            });
          }
        }
        
        await sendEmail({
          to: externalRecipients.map(r => r.email),
          subject: subject || '(Sans objet)',
          html: bodyHtml || body,
          text: body,
          attachments: emailAttachments  // ✅ AJOUT DES PIÈCES JOINTES
        }).catch(err => logger.error('Erreur envoi email externe:', err));
      }
    }

    res.status(201).json({
      success: true,
      message: scheduledFor ? 'Message programmé' : 'Message envoyé',
      data: { id: message.id }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur lors de l\'envoi du message:', error);
    next(error);
  }
};

/**
 * Sauvegarder un brouillon
 */
exports.saveDraft = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { subject, body, bodyHtml, recipients, attachments: attachmentIds, draftId } = req.body;

    const senderEmail = req.user?.email || req.user?.username || 'system@logsys.local';
    const senderName = req.user?.fullName || req.user?.full_name || req.user?.username || req.user?.email || 'Utilisateur LogSys';

    let message;

    if (draftId) {
      message = await Message.findByPk(draftId);
      if (!message || message.senderId !== req.user.id) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Brouillon non trouvé' });
      }
      await message.update({
        subject: subject || '(Sans objet)',
        bodyText: body || '',
        bodyHtml: bodyHtml || body || '',
        snippet: (body || '').substring(0, 200),
        hasAttachments: attachmentIds?.length > 0 || false
      }, { transaction });
    } else {
      message = await Message.create({
        subject: subject || '(Sans objet)',
        bodyText: body || '',
        bodyHtml: bodyHtml || body || '',
        snippet: (body || '').substring(0, 200),
        senderId: req.user.id,
        senderEmail: senderEmail,
        senderName: senderName,
        hasAttachments: attachmentIds?.length > 0 || false,
        status: 'DRAFT'
      }, { transaction });
    }

    if (attachmentIds?.length > 0) {
      await Attachment.update(
        { messageId: message.id },
        { where: { id: attachmentIds }, transaction }
      );
    }

    if (recipients && !draftId) {
      for (const recipient of recipients) {
        if (recipient.email) {
          await MessageRecipient.create({
            messageId: message.id,
            recipientEmail: recipient.email,
            recipientName: recipient.name || recipient.email,
            recipientType: recipient.type || 'TO'
          }, { transaction });
        }
      }
    }

    await transaction.commit();

    res.json({ success: true, message: 'Brouillon sauvegardé', data: { id: message.id } });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur lors de la sauvegarde du brouillon:', error);
    next(error);
  }
};

/**
 * Mettre à jour un brouillon
 */
exports.updateDraft = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { subject, body, bodyHtml, recipients, attachments: attachmentIds } = req.body;

    const message = await Message.findByPk(id);
    
    if (!message) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Brouillon non trouvé' });
    }

    if (message.senderId !== req.user.id || message.status !== 'DRAFT') {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    await message.update({
      subject: subject || '(Sans objet)',
      bodyText: body || '',
      bodyHtml: bodyHtml || body || '',
      snippet: (body || '').substring(0, 200),
      hasAttachments: attachmentIds?.length > 0 || false
    }, { transaction });

    if (attachmentIds) {
      await Attachment.update(
        { messageId: message.id },
        { where: { id: attachmentIds }, transaction }
      );
    }

    if (recipients) {
      await MessageRecipient.destroy({ where: { messageId: message.id }, transaction });
      
      for (const recipient of recipients) {
        if (recipient.email) {
          await MessageRecipient.create({
            messageId: message.id,
            recipientEmail: recipient.email,
            recipientName: recipient.name || recipient.email,
            recipientType: recipient.type || 'TO'
          }, { transaction });
        }
      }
    }

    await transaction.commit();

    res.json({ success: true, message: 'Brouillon mis à jour', data: { id: message.id } });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur mise à jour brouillon:', error);
    next(error);
  }
};

/**
 * Envoyer un brouillon
 */
exports.sendDraft = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const message = await Message.findByPk(id, {
      include: ['attachments', 'recipients']
    });

    if (!message) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Brouillon non trouvé' });
    }

    if (message.senderId !== req.user.id || message.status !== 'DRAFT') {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    await message.update({ status: 'SENT', sentAt: new Date() }, { transaction });

    let sentFolder = await EmailFolder.findOne({
      where: { userId: req.user.id, folderType: 'SENT' }
    });

    if (!sentFolder) {
      sentFolder = await EmailFolder.create({
        userId: req.user.id,
        folderName: 'Envoyés',
        folderType: 'SENT',
        isSystem: true
      }, { transaction });
    }

    const senderEmail = req.user?.email || req.user?.username || 'system@logsys.local';
    const senderName = req.user?.fullName || req.user?.full_name || req.user?.username || req.user?.email || 'Utilisateur LogSys';

    await MessageRecipient.create({
      messageId: message.id,
      recipientId: req.user.id,
      recipientEmail: senderEmail,
      recipientName: senderName,
      recipientType: 'FROM',
      folderId: sentFolder.id,
      isRead: true
    }, { transaction });

    await transaction.commit();

    const externalRecipients = message.recipients?.filter(r => !r.recipientId);
    if (externalRecipients?.length > 0) {
      await sendEmail({
        to: externalRecipients.map(r => r.recipientEmail),
        subject: message.subject,
        html: message.bodyHtml || message.bodyText,
        text: message.bodyText
      }).catch(err => logger.error('Erreur envoi email:', err));
    }

    for (const recipient of message.recipients || []) {
      if (recipient.recipientId) {
        await createNotification({
          userId: recipient.recipientId,
          type: 'MESSAGE_RECEIVED',
          title: 'Nouveau message',
          message: `${senderName} vous a envoyé un message: ${message.subject || '(Sans objet)'}`,
          priority: 'NORMAL',
          actionUrl: `/messages/${message.id}`
        });
      }
    }

    res.json({ success: true, message: 'Message envoyé avec succès' });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur envoi brouillon:', error);
    next(error);
  }
};

/**
 * Upload de pièces jointes
 */
exports.uploadAttachments = async (req, res, next) => {
  try {
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const attachments = [];

    for (const file of files) {
      const storagePath = await uploadToStorage(file, `attachments/${req.user.id}`);
      
      const attachment = await Attachment.create({
        filename: path.basename(storagePath),
        originalFilename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileExtension: path.extname(file.originalname),
        storagePath: storagePath,
        uploadedBy: req.user.id
      });

      attachments.push(attachment);

      await fs.remove(file.path).catch(err => logger.warn('Erreur nettoyage fichier temporaire:', err));
    }

    res.json({
      success: true,
      data: attachments
    });

  } catch (error) {
    logger.error('Erreur lors de l\'upload des pièces jointes:', error);
    next(error);
  }
};

/**
 * Marquer des messages comme lus
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun message spécifié'
      });
    }

    await MessageRecipient.update(
      { isRead: true, readAt: new Date() },
      { where: { messageId: messageIds, recipientId: req.user.id } }
    );

    res.json({
      success: true,
      message: `${messageIds.length} message(s) marqué(s) comme lu(s)`
    });

  } catch (error) {
    logger.error('Erreur lors du marquage comme lu:', error);
    next(error);
  }
};

/**
 * Marquer des messages comme non lus
 */
exports.markAsUnread = async (req, res, next) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun message spécifié'
      });
    }

    await MessageRecipient.update(
      { isRead: false, readAt: null },
      { where: { messageId: messageIds, recipientId: req.user.id } }
    );

    res.json({
      success: true,
      message: `${messageIds.length} message(s) marqué(s) comme non lu(s)`
    });

  } catch (error) {
    logger.error('Erreur marquage comme non lu:', error);
    next(error);
  }
};

/**
 * Basculer l'étoile d'un message
 */
exports.toggleStar = async (req, res, next) => {
  try {
    const { messageId, isStarred } = req.body;

    const recipient = await MessageRecipient.findOne({
      where: { messageId, recipientId: req.user.id }
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    await recipient.update({ isStarred });

    res.json({
      success: true,
      data: { isStarred }
    });

  } catch (error) {
    logger.error('Erreur lors du basculement de l\'étoile:', error);
    next(error);
  }
};

/**
 * Déplacer des messages vers un dossier
 */
exports.moveToFolder = async (req, res, next) => {
  try {
    const { messageIds, folder } = req.body;

    if (!messageIds || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun message spécifié'
      });
    }

    const folderRecord = await EmailFolder.findOne({
      where: { userId: req.user.id, folderType: folder }
    });

    if (!folderRecord && folder !== 'ARCHIVE' && folder !== 'TRASH') {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    const updateData = {};
    
    if (folderRecord) {
      updateData.folderId = folderRecord.id;
    }

    if (folder === 'ARCHIVE') {
      updateData.isArchived = true;
      updateData.isDeleted = false;
    } else if (folder === 'TRASH') {
      updateData.isDeleted = true;
      updateData.isArchived = false;
    } else {
      updateData.isArchived = false;
      updateData.isDeleted = false;
    }

    await MessageRecipient.update(updateData, {
      where: { messageId: messageIds, recipientId: req.user.id }
    });

    res.json({
      success: true,
      message: `${messageIds.length} message(s) déplacé(s)`
    });

  } catch (error) {
    logger.error('Erreur lors du déplacement des messages:', error);
    next(error);
  }
};

/**
 * Supprimer définitivement des messages
 */
exports.deleteMessages = async (req, res, next) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun message spécifié'
      });
    }

    const attachments = await Attachment.findAll({
      where: { messageId: messageIds }
    });

    for (const att of attachments) {
      await deleteFromStorage(att.storagePath).catch(err => 
        logger.warn('Erreur suppression fichier:', err)
      );
    }

    await MessageRecipient.destroy({
      where: { messageId: messageIds, recipientId: req.user.id }
    });

    res.json({
      success: true,
      message: `${messageIds.length} message(s) supprimé(s) définitivement`
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression des messages:', error);
    next(error);
  }
};

/**
 * Supprimer un message
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    await MessageRecipient.destroy({
      where: { messageId: id, recipientId: req.user.id }
    });

    res.json({
      success: true,
      message: 'Message supprimé'
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression du message:', error);
    next(error);
  }
};

/**
 * Télécharger une pièce jointe
 */
exports.downloadAttachment = async (req, res, next) => {
  try {
    const { id, attachmentId } = req.params;

    const attachment = await Attachment.findOne({
      where: { id: attachmentId, messageId: id }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Pièce jointe non trouvée'
      });
    }

    const message = await Message.findByPk(id);
    const hasAccess = message?.senderId === req.user.id || 
      await MessageRecipient.findOne({
        where: { messageId: id, recipientId: req.user.id }
      });

    if (!hasAccess && !req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    await attachment.increment('downloadCount');

    if (!await fs.pathExists(attachment.storagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le serveur'
      });
    }

    res.download(attachment.storagePath, attachment.originalFilename);

  } catch (error) {
    logger.error('Erreur lors du téléchargement de la pièce jointe:', error);
    next(error);
  }
};

/**
 * Répondre à un message
 */
exports.replyToMessage = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { body, bodyHtml, attachments } = req.body;

    const originalMessage = await Message.findByPk(id, {
      include: ['recipients']
    });

    if (!originalMessage) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Message original non trouvé'
      });
    }

    const senderEmail = req.user?.email || req.user?.username || 'system@logsys.local';
    const senderName = req.user?.fullName || req.user?.full_name || req.user?.username || req.user?.email || 'Utilisateur LogSys';

    const subject = originalMessage.subject?.startsWith('Re:')
      ? originalMessage.subject
      : `Re: ${originalMessage.subject || ''}`;

    const quotedBody = `\n\n> Le ${new Date(originalMessage.sentAt || originalMessage.createdAt).toLocaleString()}, ${originalMessage.senderName} a écrit :\n> ${originalMessage.bodyText?.replace(/\n/g, '\n> ') || ''}`;
    
    const message = await Message.create({
      subject,
      bodyText: (body || '') + quotedBody,
      bodyHtml: (bodyHtml || body || '') + quotedBody.replace(/\n/g, '<br>'),
      snippet: (body || '').substring(0, 200),
      senderId: req.user.id,
      senderEmail: senderEmail,
      senderName: senderName,
      hasAttachments: attachments?.length > 0 || false,
      status: 'SENT',
      sentAt: new Date(),
      threadId: originalMessage.threadId || originalMessage.id
    }, { transaction });

    await MessageRecipient.create({
      messageId: message.id,
      recipientId: originalMessage.senderId,
      recipientEmail: originalMessage.senderEmail,
      recipientName: originalMessage.senderName,
      recipientType: 'TO'
    }, { transaction });

    let sentFolder = await EmailFolder.findOne({
      where: { userId: req.user.id, folderType: 'SENT' }
    });

    if (!sentFolder) {
      sentFolder = await EmailFolder.create({
        userId: req.user.id,
        folderName: 'Envoyés',
        folderType: 'SENT',
        isSystem: true
      }, { transaction });
    }

    await MessageRecipient.create({
      messageId: message.id,
      recipientId: req.user.id,
      recipientEmail: senderEmail,
      recipientName: senderName,
      recipientType: 'FROM',
      folderId: sentFolder.id,
      isRead: true
    }, { transaction });

    await transaction.commit();

    if (originalMessage.senderId) {
      await createNotification({
        userId: originalMessage.senderId,
        type: 'MESSAGE_RECEIVED',
        title: 'Nouvelle réponse',
        message: `${senderName} a répondu à votre message`,
        priority: 'NORMAL',
        actionUrl: `/messages/${message.id}`
      });
    }

    res.json({
      success: true,
      message: 'Réponse envoyée',
      data: { id: message.id }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur lors de la réponse au message:', error);
    next(error);
  }
};

/**
 * Transférer un message
 */
exports.forwardMessage = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { recipients, body, bodyHtml } = req.body;

    if (!recipients || recipients.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Au moins un destinataire est requis'
      });
    }

    const originalMessage = await Message.findByPk(id, {
      include: ['attachments']
    });

    if (!originalMessage) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Message original non trouvé'
      });
    }

    const senderEmail = req.user?.email || req.user?.username || 'system@logsys.local';
    const senderName = req.user?.fullName || req.user?.full_name || req.user?.username || req.user?.email || 'Utilisateur LogSys';

    const subject = originalMessage.subject?.startsWith('Fwd:')
      ? originalMessage.subject
      : `Fwd: ${originalMessage.subject || ''}`;

    const forwardHeader = `\n\n---------- Message transféré ----------\nDe : ${originalMessage.senderName} <${originalMessage.senderEmail}>\nDate : ${new Date(originalMessage.sentAt || originalMessage.createdAt).toLocaleString()}\nObjet : ${originalMessage.subject}\n\n`;
    
    const message = await Message.create({
      subject,
      bodyText: (body || '') + forwardHeader + originalMessage.bodyText,
      bodyHtml: (bodyHtml || body || '') + forwardHeader.replace(/\n/g, '<br>') + originalMessage.bodyHtml,
      snippet: (body || '').substring(0, 200),
      senderId: req.user.id,
      senderEmail: senderEmail,
      senderName: senderName,
      hasAttachments: originalMessage.hasAttachments || false,
      status: 'SENT',
      sentAt: new Date()
    }, { transaction });

    if (originalMessage.attachments?.length > 0) {
      for (const att of originalMessage.attachments) {
        await Attachment.create({
          messageId: message.id,
          filename: att.filename,
          originalFilename: att.originalFilename,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
          fileExtension: att.fileExtension,
          storagePath: att.storagePath,
          uploadedBy: req.user.id
        }, { transaction });
      }
    }

    for (const recipient of recipients) {
      await MessageRecipient.create({
        messageId: message.id,
        recipientEmail: recipient.email,
        recipientName: recipient.name || recipient.email,
        recipientType: recipient.type || 'TO'
      }, { transaction });
    }

    let sentFolder = await EmailFolder.findOne({
      where: { userId: req.user.id, folderType: 'SENT' }
    });

    if (!sentFolder) {
      sentFolder = await EmailFolder.create({
        userId: req.user.id,
        folderName: 'Envoyés',
        folderType: 'SENT',
        isSystem: true
      }, { transaction });
    }

    await MessageRecipient.create({
      messageId: message.id,
      recipientId: req.user.id,
      recipientEmail: senderEmail,
      recipientName: senderName,
      recipientType: 'FROM',
      folderId: sentFolder.id,
      isRead: true
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Message transféré',
      data: { id: message.id }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur lors du transfert du message:', error);
    next(error);
  }
};