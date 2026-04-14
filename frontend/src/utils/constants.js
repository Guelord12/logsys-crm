export const APP_NAME = 'LogSys CRM';
export const APP_VERSION = '1.0.0';
export const APP_FOOTER = 'From G-tech';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';
export const TIME_FORMAT = 'HH:mm';

export const CURRENCIES = {
  USD: { symbol: '$', name: 'Dollar US' },
  EUR: { symbol: '€', name: 'Euro' },
  XOF: { symbol: 'FCFA', name: 'Franc CFA' },
  XAF: { symbol: 'FCFA', name: 'Franc CFA' },
  MAD: { symbol: 'MAD', name: 'Dirham' }
};

export const LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'es', name: 'Español' }
];

export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Paris', label: 'Europe/Paris' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai' }
];

export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ARCHIVES: ['application/zip', 'application/x-rar-compressed']
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_ATTACHMENTS = 10;

export const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Basse', color: 'green' },
  { value: 'MEDIUM', label: 'Moyenne', color: 'yellow' },
  { value: 'HIGH', label: 'Haute', color: 'orange' },
  { value: 'URGENT', label: 'Urgente', color: 'red' }
];

export const TASK_STATUSES = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'CANCELLED', label: 'Annulé' },
  { value: 'ON_HOLD', label: 'En pause' }
];

export const MEETING_TYPES = [
  { value: 'VIDEO', label: 'Visioconférence' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'WEBINAR', label: 'Webinaire' },
  { value: 'IN_PERSON', label: 'Présentiel' }
];

export const USER_STATUSES = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'LOCKED', label: 'Verrouillé' },
  { value: 'PENDING_ACTIVATION', label: 'En attente d\'activation' }
];

export const COMPANY_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspendue' },
  { value: 'EXPIRED', label: 'Expirée' },
  { value: 'CANCELLED', label: 'Annulée' },
  { value: 'PENDING', label: 'En attente' }
];

export const SUBSCRIPTION_PLANS = [
  { value: 'BASIC', label: 'Basic', maxUsers: 5, price: 0 },
  { value: 'PRO', label: 'Pro', maxUsers: 50, price: 100 },
  { value: 'ENTERPRISE', label: 'Enterprise', maxUsers: 100, price: 150 }
];

export const MODULES = [
  { code: 'DASHBOARD', name: 'Tableau de Bord' },
  { code: 'MESSAGING', name: 'Messagerie' },
  { code: 'MEETING', name: 'Réunions' },
  { code: 'NOTIFICATION', name: 'Notifications' },
  { code: 'LOGISTICS', name: 'Logistique' },
  { code: 'ACCOUNTING', name: 'Comptabilité' },
  { code: 'AUDIT', name: 'Audit' },
  { code: 'DOCUMENT', name: 'Documents' },
  { code: 'TASK', name: 'Tâches' }
];