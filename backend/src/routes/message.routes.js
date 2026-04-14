const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { upload } = require('../middleware/upload.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Gestion de la messagerie
 */

// Dossiers
router.get('/folders', messageController.getFolders);
router.get('/folders/counts', messageController.getFolderCounts);

// Messages
router.get('/', messageController.getMessages);
router.get('/:id', messageController.getMessage);
router.post('/', validate(schemas.sendMessage), messageController.sendMessage);
router.post('/draft', messageController.saveDraft);
router.put('/:id/draft', messageController.updateDraft);
router.post('/:id/send', messageController.sendDraft);

// Pièces jointes
router.post('/upload', upload.array('attachments', 10), messageController.uploadAttachments);
router.get('/:id/attachments/:attachmentId', messageController.downloadAttachment);

// Actions sur les messages
router.post('/mark-read', messageController.markAsRead);
router.post('/mark-unread', messageController.markAsUnread);
router.post('/toggle-star', messageController.toggleStar);
router.post('/move', messageController.moveToFolder);
router.delete('/', messageController.deleteMessages);
router.delete('/:id', messageController.deleteMessage);

// Réponses et transferts
router.post('/:id/reply', validate(schemas.sendMessage), messageController.replyToMessage);
router.post('/:id/forward', validate(schemas.sendMessage), messageController.forwardMessage);

module.exports = router;