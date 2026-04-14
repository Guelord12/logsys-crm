const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');
const fs = require('fs-extra');

let transporter = null;

/**
 * Initialiser le transporteur email
 */
const initTransporter = () => {
  if (config.email.smtp.auth.user && config.email.smtp.auth.pass) {
    try {
      transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass
        }
      });
      logger.info('✅ Service Email initialisé');
    } catch (error) {
      logger.warn('⚠️ Service Email non configuré - mode simulation');
      transporter = null;
    }
  } else {
    logger.info('ℹ️ Email non configuré - mode simulation activé');
  }
};

/**
 * Envoyer un email avec pièces jointes
 * @param {Object} options - Options d'envoi
 * @param {string|string[]} options.to - Destinataire(s)
 * @param {string} options.subject - Sujet
 * @param {string} options.html - Contenu HTML
 * @param {string} options.text - Contenu texte brut
 * @param {Array} options.attachments - Pièces jointes [{ filename, path, contentType }]
 */
const sendEmail = async (options) => {
  const { to, subject, html, text, attachments = [] } = options;

  try {
    if (!transporter) {
      // Mode simulation
      logger.info(`📧 [EMAIL SIMULÉ] À: ${to} | Sujet: ${subject} | Pièces jointes: ${attachments.length}`);
      return { success: true, simulated: true };
    }

    const mailOptions = {
      from: config.email.from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text
    };

    // ✅ AJOUT DES PIÈCES JOINTES
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = await Promise.all(attachments.map(async (att) => {
        // Si c'est un chemin de fichier, lire le fichier
        if (att.path && await fs.pathExists(att.path)) {
          return {
            filename: att.filename,
            path: att.path,
            contentType: att.contentType
          };
        }
        // Si c'est déjà un buffer ou contenu
        return att;
      }));
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`📧 Email envoyé: ${info.messageId} | Pièces jointes: ${attachments.length}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error('❌ Erreur envoi email:', error.message);
    return { success: false, error: error.message };
  }
};

// Initialiser
initTransporter();

module.exports = {
  sendEmail,
  transporter
};