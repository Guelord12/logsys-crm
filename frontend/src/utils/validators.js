/**
 * Valider un email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Valider un mot de passe
 */
export const validatePassword = (password) => {
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
export const validatePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
};

/**
 * Valider un code postal
 */
export const validatePostalCode = (code) => {
  return /^[A-Z0-9]{3,10}$/i.test(code);
};

/**
 * Valider une URL
 */
export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Valider un nombre
 */
export const validateNumber = (value, min = null, max = null) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

/**
 * Valider un entier
 */
export const validateInteger = (value, min = null, max = null) => {
  const num = parseInt(value);
  if (isNaN(num)) return false;
  if (!Number.isInteger(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

/**
 * Valider une date
 */
export const validateDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

/**
 * Valider une date dans le futur
 */
export const validateFutureDate = (date) => {
  if (!validateDate(date)) return false;
  return new Date(date) > new Date();
};

/**
 * Valider une date dans le passé
 */
export const validatePastDate = (date) => {
  if (!validateDate(date)) return false;
  return new Date(date) < new Date();
};

/**
 * Valider que deux mots de passe correspondent
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * Valider un formulaire requis
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Obtenir les erreurs de validation d'un mot de passe
 */
export const getPasswordErrors = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Au moins 8 caractères');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Une majuscule');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Une minuscule');
  }
  if (!/\d/.test(password)) {
    errors.push('Un chiffre');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Un caractère spécial (@$!%*?&)');
  }
  
  return errors;
};