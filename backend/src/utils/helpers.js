const crypto = require('crypto');
const moment = require('moment-timezone');
const generatePassword = require('generate-password');

/**
 * Générer un mot de passe temporaire
 */
const generateTemporaryPassword = (length = 12) => {
  return generatePassword.generate({
    length,
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
    strict: true,
    excludeSimilarCharacters: true
  });
};

/**
 * Générer un code aléatoire
 */
const generateCode = (prefix, length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${code}`;
};

/**
 * Générer un UUID court
 */
const generateShortUuid = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

/**
 * Générer un token aléatoire
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hasher une chaîne avec SHA256
 */
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

/**
 * Formater une date
 */
const formatDate = (date, format = 'DD/MM/YYYY', timezone = 'UTC') => {
  if (!date) return '';
  return moment(date).tz(timezone).format(format);
};

/**
 * Formater une date avec heure
 */
const formatDateTime = (date, timezone = 'UTC') => {
  if (!date) return '';
  return moment(date).tz(timezone).format('DD/MM/YYYY HH:mm');
};

/**
 * Formater une heure
 */
const formatTime = (date, timezone = 'UTC') => {
  if (!date) return '';
  return moment(date).tz(timezone).format('HH:mm');
};

/**
 * Formater une durée en minutes
 */
const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  }
  return `${mins} min`;
};

/**
 * Formater un montant en devise
 */
const formatCurrency = (amount, currency = 'USD', locale = 'fr-FR') => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Formater un numéro de téléphone
 */
const formatPhoneNumber = (phone, countryCode) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }
  
  return phone;
};

/**
 * Formater une taille de fichier
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Tronquer un texte
 */
const truncate = (text, length = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
};

/**
 * Convertir une chaîne en slug
 */
const slugify = (text) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

/**
 * Capitaliser la première lettre
 */
const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Calculer le pourcentage
 */
const calculatePercentage = (value, total, decimals = 0) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Calculer la différence entre deux dates en jours
 */
const daysBetween = (date1, date2) => {
  const d1 = moment(date1).startOf('day');
  const d2 = moment(date2).startOf('day');
  return d2.diff(d1, 'days');
};

/**
 * Vérifier si une date est dans le futur
 */
const isFutureDate = (date) => {
  return moment(date).isAfter(moment());
};

/**
 * Vérifier si une date est dans le passé
 */
const isPastDate = (date) => {
  return moment(date).isBefore(moment());
};

/**
 * Obtenir le début du mois
 */
const startOfMonth = (date = new Date()) => {
  return moment(date).startOf('month').toDate();
};

/**
 * Obtenir la fin du mois
 */
const endOfMonth = (date = new Date()) => {
  return moment(date).endOf('month').toDate();
};

/**
 * Obtenir le début de l'année
 */
const startOfYear = (date = new Date()) => {
  return moment(date).startOf('year').toDate();
};

/**
 * Obtenir la fin de l'année
 */
const endOfYear = (date = new Date()) => {
  return moment(date).endOf('year').toDate();
};

/**
 * Ajouter des jours à une date
 */
const addDays = (date, days) => {
  return moment(date).add(days, 'days').toDate();
};

/**
 * Ajouter des mois à une date
 */
const addMonths = (date, months) => {
  return moment(date).add(months, 'months').toDate();
};

/**
 * Soustraire des jours à une date
 */
const subtractDays = (date, days) => {
  return moment(date).subtract(days, 'days').toDate();
};

/**
 * Grouper un tableau par une clé
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Trier un tableau d'objets par une clé
 */
const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    let aVal = typeof key === 'function' ? key(a) : a[key];
    let bVal = typeof key === 'function' ? key(b) : b[key];
    
    if (order === 'desc') {
      [aVal, bVal] = [bVal, aVal];
    }
    
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
};

/**
 * Supprimer les doublons d'un tableau
 */
const unique = (array, key) => {
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }
  return [...new Set(array)];
};

/**
 * Paginer un tableau
 */
const paginate = (array, page = 1, limit = 20) => {
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    data: array.slice(start, end),
    pagination: {
      total: array.length,
      page,
      limit,
      totalPages: Math.ceil(array.length / limit)
    }
  };
};

/**
 * Aplatir un objet
 */
const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

/**
 * Délai asynchrone
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Réessayer une fonction asynchrone
 */
const retry = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry = null
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (onRetry) {
        onRetry(attempt, error);
      }
      
      if (attempt < maxAttempts) {
        const waitTime = backoff === 'exponential' 
          ? delay * Math.pow(2, attempt - 1)
          : delay;
        await sleep(waitTime);
      }
    }
  }
  
  throw lastError;
};

/**
 * Masquer une partie d'un email
 */
const maskEmail = (email) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  
  const maskedUsername = username.charAt(0) + 
    '*'.repeat(username.length - 2) + 
    username.charAt(username.length - 1);
  
  return `${maskedUsername}@${domain}`;
};

/**
 * Masquer un numéro de téléphone
 */
const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 6) return phone;
  
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
};

/**
 * Valider un email
 */
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Valider un numéro de téléphone
 */
const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
};

/**
 * Échapper les caractères HTML
 */
const escapeHtml = (text) => {
  if (!text) return '';
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
};

/**
 * Convertir une chaîne en base64
 */
const toBase64 = (str) => {
  return Buffer.from(str).toString('base64');
};

/**
 * Décoder une chaîne base64
 */
const fromBase64 = (str) => {
  return Buffer.from(str, 'base64').toString('utf-8');
};

/**
 * Obtenir l'extension d'un fichier
 */
const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Vérifier si une chaîne est un JSON valide
 */
const isValidJson = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Fusionner deux objets profondément
 */
const deepMerge = (target, source) => {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
};

const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Convertir les clés d'un objet en camelCase
 */
const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

/**
 * Convertir les clés d'un objet en snake_case
 */
const toSnakeCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

/**
 * Supprimer les propriétés null ou undefined d'un objet
 */
const compactObject = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== null && obj[key] !== undefined) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Générer une plage de dates
 */
const dateRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = moment(startDate);
  const end = moment(endDate);
  
  while (currentDate <= end) {
    dates.push(currentDate.toDate());
    currentDate = currentDate.add(1, 'days');
  }
  
  return dates;
};

module.exports = {
  generateTemporaryPassword,
  generateCode,
  generateShortUuid,
  generateToken,
  hashString,
  formatDate,
  formatDateTime,
  formatTime,
  formatDuration,
  formatCurrency,
  formatPhoneNumber,
  formatFileSize,
  truncate,
  slugify,
  capitalize,
  calculatePercentage,
  daysBetween,
  isFutureDate,
  isPastDate,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addMonths,
  subtractDays,
  groupBy,
  sortBy,
  unique,
  paginate,
  flattenObject,
  sleep,
  retry,
  maskEmail,
  maskPhone,
  isValidEmail,
  isValidPhone,
  escapeHtml,
  toBase64,
  fromBase64,
  getFileExtension,
  isValidJson,
  deepMerge,
  toCamelCase,
  toSnakeCase,
  compactObject,
  dateRange
};