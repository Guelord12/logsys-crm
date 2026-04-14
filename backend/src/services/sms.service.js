const config = require('../config/config');
const logger = require('../utils/logger');

let twilioClient = null;

/**
 * Initialiser le client Twilio (seulement si configuré)
 */
const initTwilio = () => {
  if (config.sms.accountSid && config.sms.authToken) {
    // Vérifier que l'accountSid commence par "AC"
    if (config.sms.accountSid.startsWith('AC')) {
      try {
        const twilio = require('twilio');
        twilioClient = twilio(config.sms.accountSid, config.sms.authToken);
        logger.info('✅ Client Twilio initialisé');
      } catch (error) {
        logger.warn('⚠️ Impossible d\'initialiser Twilio:', error.message);
        twilioClient = null;
      }
    } else {
      logger.warn('⚠️ Twilio accountSid invalide (doit commencer par "AC") - SMS désactivés');
    }
  } else {
    logger.info('ℹ️ Twilio non configuré - SMS désactivés (mode développement)');
  }
};

/**
 * Envoyer un SMS (simulé en développement)
 */
const sendSMS = async (options) => {
  const { to, message, priority = 'normal' } = options;

  try {
    if (!twilioClient) {
      // Mode développement : simuler l'envoi
      logger.info(`📱 [SMS SIMULÉ] À: ${to} | Message: ${message.substring(0, 50)}...`);
      return { success: true, simulated: true, to, message };
    }

    // Mode production : vrai envoi
    const result = await twilioClient.messages.create({
      body: message,
      from: config.sms.phoneNumber,
      to
    });

    logger.info(`📱 SMS envoyé: ${result.sid} à ${to}`);
    return { success: true, sid: result.sid };

  } catch (error) {
    logger.error('❌ Erreur envoi SMS:', error.message);
    // Ne pas bloquer l'application
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer un SMS immédiatement
 */
const sendSMSImmediate = async (to, message) => {
  return sendSMS({ to, message });
};

/**
 * Envoyer un SMS de vérification
 */
const sendVerificationSMS = async (to, code) => {
  const message = `LogSys: Votre code de vérification est ${code}. Valable 10 minutes.`;
  return sendSMS({ to, message, priority: 'high' });
};

/**
 * Envoyer un SMS de bienvenue
 */
const sendWelcomeSMS = async (to, data) => {
  const message = `LogSys: Bienvenue ${data.fullName}! Votre compte a été créé. Connectez-vous avec votre email.`;
  return sendSMS({ to, message });
};

/**
 * Formater un numéro de téléphone
 */
const formatPhoneNumber = (phoneNumber, countryCode = '+33') => {
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = countryCode + cleaned;
  }
  return cleaned;
};

/**
 * Valider un numéro de téléphone
 */
const validatePhoneNumber = async (phoneNumber) => {
  if (!twilioClient) {
    return { valid: true, simulated: true };
  }

  try {
    const result = await twilioClient.lookups.v2.phoneNumbers(phoneNumber).fetch();
    return {
      valid: result.valid,
      formatted: result.phoneNumber,
      countryCode: result.countryCode
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Initialiser Twilio (sans erreur bloquante)
try {
  initTwilio();
} catch (error) {
  logger.warn('⚠️ Service SMS désactivé:', error.message);
  twilioClient = null;
}

module.exports = {
  sendSMS,
  sendSMSImmediate,
  sendVerificationSMS,
  sendWelcomeSMS,
  formatPhoneNumber,
  validatePhoneNumber
};