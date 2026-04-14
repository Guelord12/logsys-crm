const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhooks pour services externes
 */

// Webhook pour recevoir les emails entrants (SendGrid Inbound Parse)
router.post('/email/inbound', webhookController.handleInboundEmail);

module.exports = router;