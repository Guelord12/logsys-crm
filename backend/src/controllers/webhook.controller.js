const db = require('../models');
const logger = require('../utils/logger');
const { createNotification } = require('../services/notification.service');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../models');

const { Message, MessageRecipient, Attachment, User, EmailFolder } = db;

/**
 * Traiter un email entrant (réponse externe via webhook SendGrid)
 */
exports.handleInboundEmail = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      from,
      to,
      subject,
      text,
      html,
      attachments = [],
      headers = {}
    } = req.body;

    logger.info('📧 Email entrant reçu:', { from, to, subject });

    // Extraire l'email et le nom de l'expéditeur
    const fromMatch = from.match(/^(?:"?([^"]*)"?\s)?<?(.+@[^>]+)>?$/);
    const senderName = fromMatch?.[1] || from.split('@')[0] || 'Expéditeur inconnu';
    const senderEmail = fromMatch?.[2] || from;

    // Trouver l'utilisateur destinataire (celui qui a l'email de réception)
    const recipientEmail = Array.isArray(to) ? to[0] : to;
    const recipientUser = await User.findOne({
      where: { email: recipientEmail }
    });

    if (!recipientUser) {
      logger.warn('Destinataire non trouvé:', recipientEmail);
      await transaction.rollback();
      return res.status(200).send('OK');
    }

    // Trouver le message original via le header In-Reply-To ou References
    const inReplyTo = headers['in-reply-to'] || headers['references'];
    let originalMessage = null;
    
    if (inReplyTo) {
      originalMessage = await Message.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { messageIdExternal: inReplyTo },
            { threadId: inReplyTo }
          ]
        }
      });
    }

    // Créer le message entrant
    const message = await Message.create({
      subject: subject || '(Sans objet)',
      bodyText: text || '',
      bodyHtml: html || text || '',
      snippet: (text || '').substring(0, 200),
      senderEmail: senderEmail,
      senderName: senderName,
      senderId: null, // Expéditeur externe
      hasAttachments: attachments?.length > 0 || false,
      status: 'SENT',
      receivedAt: new Date(),
      sentAt: headers['date'] ? new Date(headers['date']) : new Date(),
      threadId: originalMessage?.threadId || originalMessage?.id || uuidv4()
    }, { transaction });

    // Trouver ou créer le dossier INBOX du destinataire
    let inboxFolder = await EmailFolder.findOne({
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

    // Ajouter le destinataire
    await MessageRecipient.create({
      messageId: message.id,
      recipientId: recipientUser.id,
      recipientEmail: recipientEmail,
      recipientName: recipientUser.fullName,
      recipientType: 'TO',
      folderId: inboxFolder.id,
      isRead: false
    }, { transaction });

    // Traiter les pièces jointes
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        try {
          // Télécharger le fichier depuis l'URL SendGrid
          const response = await fetch(att.url);
          const buffer = Buffer.from(await response.arrayBuffer());
          
          const uploadDir = path.join(__dirname, '../../uploads/attachments', recipientUser.id);
          await fs.ensureDir(uploadDir);
          
          const filename = `${uuidv4()}_${att.filename}`;
          const filePath = path.join(uploadDir, filename);
          await fs.writeFile(filePath, buffer);

          await Attachment.create({
            messageId: message.id,
            filename: filename,
            originalFilename: att.filename,
            fileSize: buffer.length,
            mimeType: att.type || 'application/octet-stream',
            fileExtension: path.extname(att.filename),
            storagePath: filePath,
            uploadedBy: recipientUser.id
          }, { transaction });
        } catch (attErr) {
          logger.error('Erreur traitement pièce jointe:', attErr);
        }
      }
    }

    await transaction.commit();

    // Créer une notification pour l'utilisateur
    await createNotification({
      userId: recipientUser.id,
      type: 'MESSAGE_RECEIVED',
      title: 'Nouveau message externe',
      message: `${senderName} vous a répondu : ${subject || '(Sans objet)'}`,
      priority: 'NORMAL',
      actionUrl: `/messages/${message.id}`,
      sourceType: 'MESSAGE',
      sourceId: message.id
    }).catch(err => logger.warn('Erreur notification:', err));

    logger.info('✅ Email entrant traité avec succès:', message.id);
    res.status(200).send('OK');

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur traitement email entrant:', error);
    res.status(200).send('OK'); // Toujours OK pour éviter les retries
  }
};

/**
 * Vérifier la signature SendGrid (optionnel mais recommandé)
 */
exports.verifySendGridSignature = (req, res, next) => {
  // Implémenter la vérification de signature si nécessaire
  next();
};