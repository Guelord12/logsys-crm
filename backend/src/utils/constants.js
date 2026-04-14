module.exports = {
  // Statuts utilisateur
  USER_STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    LOCKED: 'LOCKED',
    PENDING_ACTIVATION: 'PENDING_ACTIVATION'
  },

  // Statuts entreprise
  COMPANY_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
    PENDING: 'PENDING'
  },

  // Types d'abonnement
  SUBSCRIPTION_PLANS: {
    BASIC: 'BASIC',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE'
  },

  // Statuts abonnement
  SUBSCRIPTION_STATUS: {
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
    SUSPENDED: 'SUSPENDED',
    PENDING_PAYMENT: 'PENDING_PAYMENT'
  },

  // Types d'utilisateur
  USER_TYPES: {
    SYS_ADMIN: 'SYS_ADMIN',
    COMPANY_ADMIN: 'COMPANY_ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
    ACCOUNTANT: 'ACCOUNTANT',
    LOGISTICIAN: 'LOGISTICIAN',
    SALES: 'SALES',
    SUPPORT: 'SUPPORT',
    AUDITOR: 'AUDITOR',
    EXTERNAL: 'EXTERNAL'
  },

  // Types de modules
  MODULES: {
    DASHBOARD: 'DASHBOARD',
    MESSAGING: 'MESSAGING',
    MEETING: 'MEETING',
    NOTIFICATION: 'NOTIFICATION',
    LOGISTICS: 'LOGISTICS',
    ACCOUNTING: 'ACCOUNTING',
    AUDIT: 'AUDIT',
    DOCUMENT: 'DOCUMENT',
    TASK: 'TASK',
    REPORT: 'REPORT',
    SETTINGS: 'SETTINGS',
    ADMIN: 'ADMIN'
  },

  // Niveaux de permission
  PERMISSION_LEVELS: {
    VIEW: 'VIEW',
    CREATE: 'CREATE',
    EDIT: 'EDIT',
    DELETE: 'DELETE',
    ADMIN: 'ADMIN'
  },

  // Types de notification
  NOTIFICATION_TYPES: {
    SUBSCRIPTION_EXPIRATION: 'SUBSCRIPTION_EXPIRATION',
    SUBSCRIPTION_RENEWAL: 'SUBSCRIPTION_RENEWAL',
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    NEW_USER_CREATED: 'NEW_USER_CREATED',
    PASSWORD_RESET: 'PASSWORD_RESET',
    TASK_ASSIGNED: 'TASK_ASSIGNED',
    MEETING_INVITATION: 'MEETING_INVITATION',
    MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
    STOCK_ALERT: 'STOCK_ALERT'
  },

  // Priorités notification
  NOTIFICATION_PRIORITIES: {
    LOW: 'LOW',
    NORMAL: 'NORMAL',
    HIGH: 'HIGH',
    URGENT: 'URGENT'
  },

  // Types de réunion
  MEETING_TYPES: {
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO',
    WEBINAR: 'WEBINAR',
    IN_PERSON: 'IN_PERSON'
  },

  // Statuts réunion
  MEETING_STATUS: {
    SCHEDULED: 'SCHEDULED',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    POSTPONED: 'POSTPONED'
  },

  // Types de mouvement de stock
  MOVEMENT_TYPES: {
    RECEIPT: 'RECEIPT',
    ISSUE: 'ISSUE',
    TRANSFER: 'TRANSFER',
    ADJUSTMENT: 'ADJUSTMENT',
    RETURN: 'RETURN',
    PRODUCTION: 'PRODUCTION'
  },

  // Types de compte comptable
  ACCOUNT_TYPES: {
    ASSET: 'ASSET',
    LIABILITY: 'LIABILITY',
    EQUITY: 'EQUITY',
    REVENUE: 'REVENUE',
    EXPENSE: 'EXPENSE'
  },

  // Statuts écriture comptable
  ENTRY_STATUS: {
    DRAFT: 'DRAFT',
    POSTED: 'POSTED',
    VALIDATED: 'VALIDATED',
    REVERSED: 'REVERSED'
  },

  // Statuts facture
  INVOICE_STATUS: {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    PARTIALLY_PAID: 'PARTIALLY_PAID',
    PAID: 'PAID',
    OVERDUE: 'OVERDUE',
    CANCELLED: 'CANCELLED'
  },

  // Méthodes de paiement
  PAYMENT_METHODS: {
    CASH: 'CASH',
    CHECK: 'CHECK',
    BANK_TRANSFER: 'BANK_TRANSFER',
    CREDIT_CARD: 'CREDIT_CARD',
    MOBILE_MONEY: 'MOBILE_MONEY'
  },

  // Niveaux d'accès document
  DOCUMENT_ACCESS_LEVELS: {
    PUBLIC: 'PUBLIC',
    INTERNAL: 'INTERNAL',
    RESTRICTED: 'RESTRICTED',
    CONFIDENTIAL: 'CONFIDENTIAL'
  },

  // Types d'action audit
  AUDIT_ACTIONS: {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    EXPORT: 'EXPORT',
    IMPORT: 'IMPORT',
    EXECUTE: 'EXECUTE'
  },

  // Devises
  CURRENCIES: {
    USD: 'USD',
    EUR: 'EUR',
    XOF: 'XOF',
    XAF: 'XAF',
    MAD: 'MAD',
    DZD: 'DZD',
    TND: 'TND'
  },

  // Langues
  LANGUAGES: {
    FR: 'fr',
    EN: 'en',
    AR: 'ar',
    ES: 'es'
  },

  // Fuseaux horaires
  TIMEZONES: {
    UTC: 'UTC',
    PARIS: 'Europe/Paris',
    LONDON: 'Europe/London',
    NEW_YORK: 'America/New_York',
    DUBAI: 'Asia/Dubai'
  },

  // Limites
  LIMITS: {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    MAX_ATTACHMENTS: 10,
    MAX_RECIPIENTS: 50,
    MAX_MEETING_DURATION: 480, // 8 heures en minutes
    PASSWORD_MIN_LENGTH: 8,
    SESSION_TIMEOUT: 480 // 8 heures en minutes
  },

  // Regex
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[0-9]{8,15}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    TAX_ID: /^[A-Z0-9]{5,20}$/,
    POSTAL_CODE: /^[A-Z0-9]{3,10}$/i
  }
};