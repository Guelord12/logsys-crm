const validator = require('validator');

/**
 * Valider un email
 */
const validateEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Valider un mot de passe
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  return password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar;
};

/**
 * Valider un numéro de téléphone
 */
const validatePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
};

/**
 * Valider un code postal
 */
const validatePostalCode = (code) => {
  return /^[A-Z0-9]{3,10}$/i.test(code);
};

/**
 * Valider un numéro de TVA
 */
const validateVAT = (vat) => {
  return /^[A-Z]{2}[A-Z0-9]{2,12}$/i.test(vat);
};

/**
 * Valider une URL
 */
const validateURL = (url) => {
  return validator.isURL(url, {
    require_protocol: false,
    require_valid_protocol: true,
    protocols: ['http', 'https']
  });
};

/**
 * Valider une date
 */
const validateDate = (date) => {
  return validator.isDate(date) && !isNaN(new Date(date).getTime());
};

/**
 * Valider un UUID
 */
const validateUUID = (uuid) => {
  return validator.isUUID(uuid);
};

/**
 * Valider un nombre décimal
 */
const validateDecimal = (value, min = null, max = null) => {
  if (!validator.isDecimal(value.toString())) {
    return false;
  }
  
  const num = parseFloat(value);
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  
  return true;
};

/**
 * Valider un entier
 */
const validateInteger = (value, min = null, max = null) => {
  if (!validator.isInt(value.toString())) {
    return false;
  }
  
  const num = parseInt(value);
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  
  return true;
};

/**
 * Valider un code couleur hexadécimal
 */
const validateHexColor = (color) => {
  return validator.isHexColor(color);
};

/**
 * Valider un slug
 */
const validateSlug = (slug) => {
  return validator.isSlug(slug);
};

/**
 * Valider une adresse IP
 */
const validateIP = (ip) => {
  return validator.isIP(ip);
};

/**
 * Valider un JSON
 */
const validateJSON = (str) => {
  return validator.isJSON(str);
};

/**
 * Valider un JWT
 */
const validateJWT = (token) => {
  return validator.isJWT(token);
};

/**
 * Valider un numéro de compte bancaire (IBAN)
 */
const validateIBAN = (iban) => {
  return validator.isIBAN(iban);
};

/**
 * Valider un code BIC/SWIFT
 */
const validateBIC = (bic) => {
  return validator.isBIC(bic);
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validatePostalCode,
  validateVAT,
  validateURL,
  validateDate,
  validateUUID,
  validateDecimal,
  validateInteger,
  validateHexColor,
  validateSlug,
  validateIP,
  validateJSON,
  validateJWT,
  validateIBAN,
  validateBIC
};