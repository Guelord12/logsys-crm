/**
 * Formater une date
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  
  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  
  return d.toLocaleDateString('fr-FR');
};

/**
 * Formater une date avec heure
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formater une heure
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formater une durée en minutes
 */
export const formatDuration = (minutes) => {
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
export const formatCurrency = (amount, currency = 'USD', locale = 'fr-FR') => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Formater un numéro de téléphone
 */
export const formatPhoneNumber = (phone, countryCode = '+33') => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }
  
  return `${countryCode} ${phone}`;
};

/**
 * Formater une taille de fichier
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Tronquer un texte
 */
export const truncate = (text, length = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
};

/**
 * Capitaliser la première lettre
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Obtenir les initiales d'un nom
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Formater un pourcentage
 */
export const formatPercentage = (value, total, decimals = 0) => {
  if (!total || total === 0) return '0%';
  
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Formater un numéro de facture
 */
export const formatInvoiceNumber = (number) => {
  if (!number) return '';
  return number;
};

/**
 * Formater un statut
 */
export const formatStatus = (status) => {
  const statusMap = {
    ACTIVE: 'Actif',
    INACTIVE: 'Inactif',
    PENDING: 'En attente',
    SUSPENDED: 'Suspendu',
    CANCELLED: 'Annulé',
    COMPLETED: 'Terminé',
    DRAFT: 'Brouillon',
    SENT: 'Envoyé',
    PAID: 'Payé',
    OVERDUE: 'En retard',
    SCHEDULED: 'Planifié',
    ONGOING: 'En cours'
  };
  
  return statusMap[status] || status;
};

/**
 * Obtenir la couleur d'un statut
 */
export const getStatusColor = (status) => {
  const colorMap = {
    ACTIVE: 'green',
    INACTIVE: 'gray',
    PENDING: 'yellow',
    SUSPENDED: 'red',
    CANCELLED: 'red',
    COMPLETED: 'green',
    DRAFT: 'gray',
    SENT: 'blue',
    PAID: 'green',
    OVERDUE: 'red',
    SCHEDULED: 'blue',
    ONGOING: 'orange'
  };
  
  return colorMap[status] || 'gray';
};