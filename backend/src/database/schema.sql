-- =====================================================
-- LOGSYS CRM - Script complet de base de données
-- PostgreSQL 15+
-- AVEC SUPPRESSION DES TABLES EXISTANTES
-- =====================================================

-- Désactiver les contraintes de clé étrangère temporairement
SET session_replication_role = 'replica';

-- =====================================================
-- SUPPRESSION DE TOUTES LES TABLES DANS L'ORDRE CORRECT
-- =====================================================

DROP TABLE IF EXISTS payment_allocations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS customer_invoices CASCADE;
DROP TABLE IF EXISTS accounting_entry_lines CASCADE;
DROP TABLE IF EXISTS accounting_entries CASCADE;
DROP TABLE IF EXISTS auxiliary_accounts CASCADE;
DROP TABLE IF EXISTS accounting_journals CASCADE;
DROP TABLE IF EXISTS accounting_periods CASCADE;
DROP TABLE IF EXISTS shipment_items CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS purchase_order_lines CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS inventory_batches CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS logistic_items CASCADE;
DROP TABLE IF EXISTS logistic_categories CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS meeting_chats CASCADE;
DROP TABLE IF EXISTS meeting_recordings CASCADE;
DROP TABLE IF EXISTS meeting_participants CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS message_recipients CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS email_folders CASCADE;
DROP TABLE IF EXISTS subscription_notifications CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS notification_types CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS company_subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS plan_modules CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS system_modules CASCADE;
DROP TABLE IF EXISTS task_types CASCADE;
DROP TABLE IF EXISTS job_positions CASCADE;
DROP TABLE IF EXISTS business_sectors CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS user_types CASCADE;
DROP TABLE IF EXISTS chart_of_accounts_ohada CASCADE;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- TABLES DE RÉFÉRENCE
-- =====================================================

-- Pays
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone_code VARCHAR(10) NOT NULL,
    currency_code VARCHAR(3),
    currency_name VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des pays
INSERT INTO countries (code, name, phone_code, currency_code, currency_name) VALUES
('FR', 'France', '+33', 'EUR', 'Euro'),
('BE', 'Belgique', '+32', 'EUR', 'Euro'),
('CH', 'Suisse', '+41', 'CHF', 'Franc Suisse'),
('CA', 'Canada', '+1', 'CAD', 'Dollar Canadien'),
('US', 'États-Unis', '+1', 'USD', 'Dollar Américain'),
('GB', 'Royaume-Uni', '+44', 'GBP', 'Livre Sterling'),
('DE', 'Allemagne', '+49', 'EUR', 'Euro'),
('IT', 'Italie', '+39', 'EUR', 'Euro'),
('ES', 'Espagne', '+34', 'EUR', 'Euro'),
('PT', 'Portugal', '+351', 'EUR', 'Euro'),
('NL', 'Pays-Bas', '+31', 'EUR', 'Euro'),
('LU', 'Luxembourg', '+352', 'EUR', 'Euro'),
('MA', 'Maroc', '+212', 'MAD', 'Dirham Marocain'),
('DZ', 'Algérie', '+213', 'DZD', 'Dinar Algérien'),
('TN', 'Tunisie', '+216', 'TND', 'Dinar Tunisien'),
('SN', 'Sénégal', '+221', 'XOF', 'Franc CFA'),
('CI', 'Côte d''Ivoire', '+225', 'XOF', 'Franc CFA'),
('CM', 'Cameroun', '+237', 'XAF', 'Franc CFA'),
('GA', 'Gabon', '+241', 'XAF', 'Franc CFA'),
('CG', 'Congo', '+242', 'XAF', 'Franc CFA'),
('CD', 'RDC', '+243', 'CDF', 'Franc Congolais'),
('BJ', 'Bénin', '+229', 'XOF', 'Franc CFA'),
('TG', 'Togo', '+228', 'XOF', 'Franc CFA'),
('BF', 'Burkina Faso', '+226', 'XOF', 'Franc CFA'),
('ML', 'Mali', '+223', 'XOF', 'Franc CFA'),
('NE', 'Niger', '+227', 'XOF', 'Franc CFA'),
('GN', 'Guinée', '+224', 'GNF', 'Franc Guinéen'),
('MG', 'Madagascar', '+261', 'MGA', 'Ariary'),
('MU', 'Maurice', '+230', 'MUR', 'Roupie Mauricienne'),
('ZA', 'Afrique du Sud', '+27', 'ZAR', 'Rand'),
('AE', 'Émirats Arabes Unis', '+971', 'AED', 'Dirham'),
('SA', 'Arabie Saoudite', '+966', 'SAR', 'Riyal'),
('QA', 'Qatar', '+974', 'QAR', 'Riyal'),
('KW', 'Koweït', '+965', 'KWD', 'Dinar'),
('IN', 'Inde', '+91', 'INR', 'Roupie'),
('CN', 'Chine', '+86', 'CNY', 'Yuan'),
('JP', 'Japon', '+81', 'JPY', 'Yen'),
('KR', 'Corée du Sud', '+82', 'KRW', 'Won'),
('SG', 'Singapour', '+65', 'SGD', 'Dollar'),
('AU', 'Australie', '+61', 'AUD', 'Dollar'),
('NZ', 'Nouvelle-Zélande', '+64', 'NZD', 'Dollar'),
('BR', 'Brésil', '+55', 'BRL', 'Real'),
('MX', 'Mexique', '+52', 'MXN', 'Peso'),
('AR', 'Argentine', '+54', 'ARS', 'Peso'),
('CL', 'Chili', '+56', 'CLP', 'Peso'),
('CO', 'Colombie', '+57', 'COP', 'Peso'),
('PE', 'Pérou', '+51', 'PEN', 'Sol'),
('RU', 'Russie', '+7', 'RUB', 'Rouble'),
('TR', 'Turquie', '+90', 'TRY', 'Livre'),
('EG', 'Égypte', '+20', 'EGP', 'Livre'),
('NG', 'Nigéria', '+234', 'NGN', 'Naira'),
('KE', 'Kenya', '+254', 'KES', 'Shilling'),
('ET', 'Éthiopie', '+251', 'ETB', 'Birr'),
('GH', 'Ghana', '+233', 'GHS', 'Cedi');

-- Secteurs d'activité
CREATE TABLE business_sectors (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES business_sectors(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des secteurs parents d'abord
INSERT INTO business_sectors (code, name) VALUES
('AGR', 'Agriculture'),
('MIN', 'Mines et Industries Extractives'),
('MAN', 'Industrie Manufacturière'),
('BTP', 'Bâtiment et Travaux Publics'),
('ENE', 'Énergie'),
('COM', 'Commerce et Distribution'),
('TRANS', 'Transport et Logistique'),
('TECH', 'Technologies de l''Information'),
('FIN', 'Finance et Assurance'),
('IMMO', 'Immobilier'),
('SANTE', 'Santé'),
('EDU', 'Éducation et Formation'),
('CONS', 'Conseil et Services aux Entreprises'),
('TOUR', 'Tourisme et Hôtellerie'),
('MEDIA', 'Médias et Communication'),
('LOIS', 'Loisirs et Divertissement'),
('ADM', 'Administration Publique'),
('ASSOC', 'Associations et ONG'),
('AUTO', 'Automobile');

-- Sous-secteurs
INSERT INTO business_sectors (code, name, parent_id) 
SELECT 'AGRO', 'Agroalimentaire', id FROM business_sectors WHERE code = 'AGR'
UNION ALL
SELECT 'PHARMA', 'Industrie Pharmaceutique', id FROM business_sectors WHERE code = 'MAN'
UNION ALL
SELECT 'TELECOM', 'Télécommunications', id FROM business_sectors WHERE code = 'TECH'
UNION ALL
SELECT 'BANQUE', 'Banque', id FROM business_sectors WHERE code = 'FIN'
UNION ALL
SELECT 'ASSUR', 'Assurance', id FROM business_sectors WHERE code = 'FIN';

-- Types de postes
CREATE TABLE job_positions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    hierarchy_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO job_positions (code, title, hierarchy_level) VALUES
('CEO', 'Président Directeur Général', 1),
('DG', 'Directeur Général', 2),
('DGA', 'Directeur Général Adjoint', 3),
('DAF', 'Directeur Administratif et Financier', 4),
('DRH', 'Directeur des Ressources Humaines', 4),
('DSI', 'Directeur des Systèmes d''Information', 4),
('DCOMM', 'Directeur Commercial', 4),
('DMARK', 'Directeur Marketing', 4),
('DLOG', 'Directeur Logistique', 4),
('DPROD', 'Directeur de Production', 4),
('DAQ', 'Directeur Qualité', 4),
('RRH', 'Responsable Ressources Humaines', 5),
('RAF', 'Responsable Administratif et Financier', 5),
('COMPTABLE', 'Comptable', 6),
('COMMERCIAL', 'Commercial', 5),
('CHEF_PROJET', 'Chef de Projet', 5),
('DEV', 'Développeur', 6),
('TECH_SUPPORT', 'Technicien Support', 6),
('MAGASINIER', 'Magasinier', 7),
('CHAUFFEUR', 'Chauffeur', 8),
('ASSISTANT', 'Assistant de Direction', 6),
('SECRETAIRE', 'Secrétaire', 7),
('STAGIAIRE', 'Stagiaire', 10);

-- Modules système
CREATE TABLE system_modules (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_modules (code, name, description, icon, display_order) VALUES
('DASHBOARD', 'Tableau de Bord', 'Tableau de bord principal', 'ChartBarIcon', 1),
('MESSAGING', 'Messagerie', 'Système de messagerie électronique intégré', 'EnvelopeIcon', 2),
('MEETING', 'Réunions', 'Système de visioconférence et réunions virtuelles', 'VideoCameraIcon', 3),
('NOTIFICATION', 'Notifications', 'Système de notifications temps réel', 'BellIcon', 4),
('LOGISTICS', 'Logistique', 'Module de gestion logistique complète', 'TruckIcon', 5),
('ACCOUNTING', 'Comptabilité', 'Module de comptabilité OHADA', 'CurrencyDollarIcon', 6),
('AUDIT', 'Audit', 'Module d''audit et suivi système', 'ShieldCheckIcon', 7),
('DOCUMENT', 'Documents', 'Gestion documentaire et OCR', 'DocumentIcon', 8),
('TASK', 'Tâches', 'Gestion des tâches et projets', 'ClipboardListIcon', 9),
('REPORT', 'Rapports', 'Génération de rapports', 'DocumentReportIcon', 10),
('SETTINGS', 'Paramètres', 'Configuration du système', 'CogIcon', 11),
('ADMIN', 'Administration', 'Administration système', 'UserGroupIcon', 12);

-- Permissions
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES system_modules(id),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    permission_level VARCHAR(20) CHECK (permission_level IN ('VIEW', 'CREATE', 'EDIT', 'DELETE', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO permissions (module_id, code, name, permission_level)
SELECT m.id, 'DASHBOARD_VIEW', 'Voir le tableau de bord', 'VIEW'
FROM system_modules m WHERE m.code = 'DASHBOARD'
UNION ALL
SELECT m.id, 'MESSAGE_VIEW', 'Voir les messages', 'VIEW'
FROM system_modules m WHERE m.code = 'MESSAGING'
UNION ALL
SELECT m.id, 'MESSAGE_SEND', 'Envoyer des messages', 'CREATE'
FROM system_modules m WHERE m.code = 'MESSAGING'
UNION ALL
SELECT m.id, 'MESSAGE_DELETE', 'Supprimer des messages', 'DELETE'
FROM system_modules m WHERE m.code = 'MESSAGING'
UNION ALL
SELECT m.id, 'MESSAGE_ADMIN', 'Administrer la messagerie', 'ADMIN'
FROM system_modules m WHERE m.code = 'MESSAGING'
UNION ALL
SELECT m.id, 'MEETING_VIEW', 'Voir les réunions', 'VIEW'
FROM system_modules m WHERE m.code = 'MEETING'
UNION ALL
SELECT m.id, 'MEETING_CREATE', 'Créer des réunions', 'CREATE'
FROM system_modules m WHERE m.code = 'MEETING'
UNION ALL
SELECT m.id, 'MEETING_RECORD', 'Enregistrer des réunions', 'EDIT'
FROM system_modules m WHERE m.code = 'MEETING'
UNION ALL
SELECT m.id, 'MEETING_ADMIN', 'Administrer les réunions', 'ADMIN'
FROM system_modules m WHERE m.code = 'MEETING'
UNION ALL
SELECT m.id, 'LOGISTICS_VIEW', 'Voir le module logistique', 'VIEW'
FROM system_modules m WHERE m.code = 'LOGISTICS'
UNION ALL
SELECT m.id, 'LOGISTICS_MANAGE_INVENTORY', 'Gérer les stocks', 'EDIT'
FROM system_modules m WHERE m.code = 'LOGISTICS'
UNION ALL
SELECT m.id, 'LOGISTICS_CREATE_PO', 'Créer des commandes', 'CREATE'
FROM system_modules m WHERE m.code = 'LOGISTICS'
UNION ALL
SELECT m.id, 'LOGISTICS_MANAGE_WAREHOUSE', 'Gérer les entrepôts', 'ADMIN'
FROM system_modules m WHERE m.code = 'LOGISTICS'
UNION ALL
SELECT m.id, 'ACCOUNTING_VIEW', 'Voir le module comptable', 'VIEW'
FROM system_modules m WHERE m.code = 'ACCOUNTING'
UNION ALL
SELECT m.id, 'ACCOUNTING_CREATE_ENTRY', 'Créer des écritures', 'CREATE'
FROM system_modules m WHERE m.code = 'ACCOUNTING'
UNION ALL
SELECT m.id, 'ACCOUNTING_VALIDATE_ENTRY', 'Valider des écritures', 'EDIT'
FROM system_modules m WHERE m.code = 'ACCOUNTING'
UNION ALL
SELECT m.id, 'ACCOUNTING_CLOSE_PERIOD', 'Clôturer une période', 'ADMIN'
FROM system_modules m WHERE m.code = 'ACCOUNTING'
UNION ALL
SELECT m.id, 'AUDIT_VIEW', 'Voir les logs d''audit', 'VIEW'
FROM system_modules m WHERE m.code = 'AUDIT'
UNION ALL
SELECT m.id, 'AUDIT_EXPORT', 'Exporter les logs', 'EDIT'
FROM system_modules m WHERE m.code = 'AUDIT'
UNION ALL
SELECT m.id, 'AUDIT_ADMIN', 'Administrer l''audit', 'ADMIN'
FROM system_modules m WHERE m.code = 'AUDIT'
UNION ALL
SELECT m.id, 'ADMIN_MANAGE_USERS', 'Gérer les utilisateurs', 'ADMIN'
FROM system_modules m WHERE m.code = 'ADMIN'
UNION ALL
SELECT m.id, 'ADMIN_MANAGE_COMPANIES', 'Gérer les entreprises', 'ADMIN'
FROM system_modules m WHERE m.code = 'ADMIN'
UNION ALL
SELECT m.id, 'ADMIN_MANAGE_SUBSCRIPTIONS', 'Gérer les abonnements', 'ADMIN'
FROM system_modules m WHERE m.code = 'ADMIN'
UNION ALL
SELECT m.id, 'ADMIN_SYSTEM_SETTINGS', 'Gérer les paramètres système', 'ADMIN'
FROM system_modules m WHERE m.code = 'ADMIN';

-- Plans d'abonnement
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    max_users INTEGER NOT NULL,
    price_per_user DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
    is_free BOOLEAN DEFAULT false,
    features JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subscription_plans (code, name, description, max_users, price_per_user, is_free, features) VALUES
('BASIC', 'Basic', 'Abonnement gratuit limité à 5 utilisateurs', 5, 0.00, true, 
 '{"messaging": true, "meeting": true, "notification": true}'),
('PRO', 'Pro', 'Abonnement professionnel avec module logistique', 50, 100.00, false,
 '{"messaging": true, "meeting": true, "notification": true, "logistics": true, "document": true}'),
('ENTERPRISE', 'Enterprise', 'Abonnement entreprise avec modules logistique et comptable', 100, 150.00, false,
 '{"messaging": true, "meeting": true, "notification": true, "logistics": true, "accounting": true, "document": true, "audit": true}');

-- Plan modules
CREATE TABLE plan_modules (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES system_modules(id) ON DELETE CASCADE,
    is_included BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plan_id, module_id)
);

INSERT INTO plan_modules (plan_id, module_id)
SELECT sp.id, sm.id
FROM subscription_plans sp
CROSS JOIN system_modules sm
WHERE (sp.code = 'BASIC' AND sm.code IN ('DASHBOARD', 'MESSAGING', 'MEETING', 'NOTIFICATION', 'TASK', 'DOCUMENT'))
   OR (sp.code = 'PRO' AND sm.code IN ('DASHBOARD', 'MESSAGING', 'MEETING', 'NOTIFICATION', 'LOGISTICS', 'DOCUMENT', 'TASK', 'REPORT'))
   OR (sp.code = 'ENTERPRISE' AND sm.code IN ('DASHBOARD', 'MESSAGING', 'MEETING', 'NOTIFICATION', 'LOGISTICS', 'ACCOUNTING', 'AUDIT', 'DOCUMENT', 'TASK', 'REPORT'));

-- Types d'utilisateurs
CREATE TABLE user_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO user_types (code, name, description) VALUES
('SYS_ADMIN', 'Administrateur Système', 'Super administrateur de la plateforme'),
('COMPANY_ADMIN', 'Administrateur Entreprise', 'Administrateur d''une entreprise cliente'),
('MANAGER', 'Manager', 'Manager d''équipe ou de département'),
('EMPLOYEE', 'Employé', 'Utilisateur standard'),
('ACCOUNTANT', 'Comptable', 'Utilisateur du module comptable'),
('LOGISTICIAN', 'Logisticien', 'Utilisateur du module logistique'),
('SALES', 'Commercial', 'Utilisateur commercial'),
('SUPPORT', 'Support', 'Support technique'),
('AUDITOR', 'Auditeur', 'Auditeur interne'),
('EXTERNAL', 'Externe', 'Utilisateur externe');

-- Types de notifications
CREATE TABLE notification_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    default_priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (default_priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notification_types (code, name, category, default_priority) VALUES
('SUBSCRIPTION_EXPIRATION', 'Expiration d''abonnement', 'SUBSCRIPTION', 'HIGH'),
('SUBSCRIPTION_RENEWAL', 'Renouvellement d''abonnement', 'SUBSCRIPTION', 'NORMAL'),
('PAYMENT_RECEIVED', 'Paiement reçu', 'PAYMENT', 'NORMAL'),
('PAYMENT_FAILED', 'Échec de paiement', 'PAYMENT', 'URGENT'),
('NEW_USER_CREATED', 'Nouvel utilisateur créé', 'USER', 'NORMAL'),
('PASSWORD_RESET', 'Réinitialisation de mot de passe', 'SECURITY', 'HIGH'),
('TASK_ASSIGNED', 'Tâche assignée', 'TASK', 'NORMAL'),
('MEETING_INVITATION', 'Invitation à une réunion', 'MEETING', 'NORMAL'),
('MEETING_REMINDER', 'Rappel de réunion', 'MEETING', 'NORMAL'),
('MESSAGE_RECEIVED', 'Nouveau message', 'MESSAGING', 'NORMAL'),
('DOCUMENT_SHARED', 'Document partagé', 'DOCUMENT', 'LOW'),
('STOCK_ALERT', 'Alerte de stock', 'LOGISTICS', 'HIGH'),
('INVOICE_GENERATED', 'Facture générée', 'ACCOUNTING', 'NORMAL'),
('COMPANY_CREATED', 'Entreprise créée', 'COMPANY', 'NORMAL'),
('SUBSCRIPTION_CANCELLED', 'Abonnement annulé', 'SUBSCRIPTION', 'HIGH'),
('GENERAL', 'Notification générale', 'GENERAL', 'NORMAL');

-- Types de tâches
CREATE TABLE task_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_duration_hours INTEGER,
    priority_default VARCHAR(20) CHECK (priority_default IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    module_id INTEGER REFERENCES system_modules(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO task_types (code, name, priority_default, module_id)
SELECT 'GENERAL', 'Tâche générale', 'MEDIUM', id FROM system_modules WHERE code = 'TASK'
UNION ALL
SELECT 'MEETING_PREP', 'Préparation réunion', 'MEDIUM', id FROM system_modules WHERE code = 'MEETING'
UNION ALL
SELECT 'INVENTORY_CHECK', 'Vérification inventaire', 'HIGH', id FROM system_modules WHERE code = 'LOGISTICS'
UNION ALL
SELECT 'ACCOUNTING_RECON', 'Rapprochement comptable', 'HIGH', id FROM system_modules WHERE code = 'ACCOUNTING';

-- =====================================================
-- TABLES PRINCIPALES
-- =====================================================

-- Entreprises
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    tax_number VARCHAR(100) UNIQUE,
    business_sector_id INTEGER REFERENCES business_sectors(id),
    country_id INTEGER REFERENCES countries(id),
    address TEXT NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    email VARCHAR(255) NOT NULL,
    phone_country_code VARCHAR(10),
    phone_number VARCHAR(50),
    logo_url TEXT,
    website VARCHAR(255),
    executive_name VARCHAR(200) NOT NULL,
    executive_position_id INTEGER REFERENCES job_positions(id),
    executive_email VARCHAR(255) NOT NULL,
    executive_phone_code VARCHAR(10),
    executive_phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED', 'PENDING')),
    subscription_status VARCHAR(20) DEFAULT 'TRIAL' CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
    registration_date DATE DEFAULT CURRENT_DATE,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    last_modified_by UUID
);

-- Utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_code VARCHAR(50) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    phone_country_code VARCHAR(10),
    phone_number VARCHAR(50),
    avatar_url TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_type_id INTEGER REFERENCES user_types(id),
    job_position_id INTEGER REFERENCES job_positions(id),
    is_system_admin BOOLEAN DEFAULT false,
    is_company_admin BOOLEAN DEFAULT false,
    is_temporary_password BOOLEAN DEFAULT true,
    password_changed_at TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_ACTIVATION')),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    language_preference VARCHAR(10) DEFAULT 'fr',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}',
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP
);

-- Index pour utilisateurs
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_status ON users(status);

-- Abonnements des entreprises
CREATE TABLE company_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id),
    subscription_number VARCHAR(50) UNIQUE,
    user_count INTEGER NOT NULL,
    price_per_user DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    payment_due_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'PENDING_PAYMENT')),
    auto_renew BOOLEAN DEFAULT true,
    cancellation_reason TEXT,
    payment_method VARCHAR(50),
    last_payment_date TIMESTAMP,
    last_payment_amount DECIMAL(10,2),
    payment_transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP,
    cancelled_by UUID REFERENCES users(id)
);

-- Sessions utilisateurs
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logged_out_at TIMESTAMP
);

-- Historique des connexions
CREATE TABLE login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    login_status VARCHAR(20) CHECK (login_status IN ('SUCCESS', 'FAILED', 'LOCKED', 'PASSWORD_EXPIRED')),
    failure_reason TEXT,
    location_info JSONB
);

-- Rôles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    hierarchy_level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, role_code)
);

-- Permissions des rôles
CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Attribution des rôles aux utilisateurs
CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- Permissions directes utilisateur
CREATE TABLE user_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    grant_type VARCHAR(10) CHECK (grant_type IN ('GRANT', 'DENY')),
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    reason TEXT,
    UNIQUE(user_id, permission_id)
);

-- =====================================================
-- MESSAGERIE
-- =====================================================

CREATE TABLE email_folders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    folder_name VARCHAR(100) NOT NULL,
    folder_type VARCHAR(20) CHECK (folder_type IN ('INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM', 'ARCHIVE', 'CUSTOM')),
    parent_folder_id INTEGER REFERENCES email_folders(id),
    color VARCHAR(20),
    icon VARCHAR(50),
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, folder_name)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID,
    subject VARCHAR(500),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(200),
    body_text TEXT,
    body_html TEXT,
    snippet TEXT,
    importance VARCHAR(10) DEFAULT 'NORMAL' CHECK (importance IN ('LOW', 'NORMAL', 'HIGH')),
    sensitivity VARCHAR(20) DEFAULT 'NORMAL' CHECK (sensitivity IN ('NORMAL', 'PERSONAL', 'PRIVATE', 'CONFIDENTIAL')),
    has_attachments BOOLEAN DEFAULT false,
    size_bytes INTEGER,
    sent_at TIMESTAMP,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'SENT' CHECK (status IN ('DRAFT', 'SENT', 'DELIVERED', 'FAILED', 'SCHEDULED')),
    scheduled_for TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE message_recipients (
    id BIGSERIAL PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(200),
    recipient_type VARCHAR(10) CHECK (recipient_type IN ('TO', 'CC', 'BCC', 'FROM')),
    folder_id INTEGER REFERENCES email_folders(id),
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    replied_at TIMESTAMP,
    forwarded_at TIMESTAMP,
    labels TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(20),
    storage_path TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'LOCAL',
    checksum VARCHAR(255),
    encryption_key TEXT,
    is_inline BOOLEAN DEFAULT false,
    content_id VARCHAR(255),
    description TEXT,
    virus_scan_status VARCHAR(20) DEFAULT 'PENDING' CHECK (virus_scan_status IN ('PENDING', 'CLEAN', 'INFECTED', 'ERROR')),
    scanned_at TIMESTAMP,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0
);

-- =====================================================
-- RÉUNIONS
-- =====================================================

CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_code VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    duration_minutes INTEGER,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    recurrence_end_date DATE,
    parent_meeting_id UUID REFERENCES meetings(id),
    meeting_type VARCHAR(20) DEFAULT 'VIDEO' CHECK (meeting_type IN ('VIDEO', 'AUDIO', 'WEBINAR', 'IN_PERSON')),
    meeting_platform VARCHAR(50) DEFAULT 'LOGSYS_MEET',
    meeting_url TEXT,
    meeting_id_external VARCHAR(255),
    meeting_password VARCHAR(100),
    enable_waiting_room BOOLEAN DEFAULT true,
    allow_chat BOOLEAN DEFAULT true,
    allow_recording BOOLEAN DEFAULT false,
    mute_participants_on_entry BOOLEAN DEFAULT true,
    require_authentication BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT
);

CREATE TABLE meeting_participants (
    id BIGSERIAL PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    external_email VARCHAR(255),
    external_name VARCHAR(200),
    role VARCHAR(20) DEFAULT 'ATTENDEE' CHECK (role IN ('ORGANIZER', 'PRESENTER', 'ATTENDEE', 'GUEST')),
    response_status VARCHAR(20) DEFAULT 'PENDING' CHECK (response_status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE')),
    responded_at TIMESTAMP,
    response_message TEXT,
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    actual_duration_minutes INTEGER,
    connection_quality VARCHAR(20) CHECK (connection_quality IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR')),
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meeting_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    recording_url TEXT NOT NULL,
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    format VARCHAR(20) DEFAULT 'MP4',
    quality VARCHAR(20) DEFAULT 'HD',
    has_transcription BOOLEAN DEFAULT false,
    transcription_text TEXT,
    transcription_url TEXT,
    processing_status VARCHAR(20) DEFAULT 'PENDING' CHECK (processing_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    processed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE meeting_chats (
    id BIGSERIAL PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'FILE', 'SYSTEM', 'EMOJI')),
    is_private BOOLEAN DEFAULT false,
    recipient_id UUID REFERENCES users(id),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_code VARCHAR(50) UNIQUE,
    type_id INTEGER REFERENCES notification_types(id),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    rich_content JSONB,
    action_url TEXT,
    action_text VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ', 'ARCHIVED', 'DELETED')),
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    expires_at TIMESTAMP,
    channels_used TEXT[],
    source_type VARCHAR(50),
    source_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_templates (
    id SERIAL PRIMARY KEY,
    template_code VARCHAR(50) NOT NULL UNIQUE,
    template_name VARCHAR(100) NOT NULL,
    type_id INTEGER REFERENCES notification_types(id),
    email_subject_template TEXT,
    email_body_template TEXT,
    email_html_template TEXT,
    sms_template TEXT,
    push_title_template TEXT,
    push_body_template TEXT,
    in_app_title_template TEXT,
    in_app_message_template TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscription_notifications (
    id BIGSERIAL PRIMARY KEY,
    company_subscription_id UUID REFERENCES company_subscriptions(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id),
    notification_type VARCHAR(30) CHECK (notification_type IN ('EXPIRATION_WARNING', 'EXPIRED', 'RENEWAL', 'PAYMENT_REMINDER')),
    days_before_expiry INTEGER,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP
);

-- =====================================================
-- GESTION DOCUMENTAIRE
-- =====================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    document_code VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    document_type VARCHAR(50),
    category VARCHAR(100),
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(20),
    storage_path TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'LOCAL',
    checksum VARCHAR(255),
    version_number INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES documents(id),
    tags TEXT[],
    metadata JSONB,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    is_public BOOLEAN DEFAULT false,
    access_level VARCHAR(20) DEFAULT 'RESTRICTED' CHECK (access_level IN ('PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL')),
    ocr_text TEXT,
    indexed_content TSVECTOR,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    deleted_at TIMESTAMP,
    UNIQUE(company_id, document_code)
);

-- =====================================================
-- TÂCHES
-- =====================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    task_code VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    task_type_id INTEGER REFERENCES task_types(id),
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    department_id INTEGER,
    start_date DATE,
    due_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD')),
    completion_percentage INTEGER DEFAULT 0,
    parent_task_id UUID REFERENCES tasks(id),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id),
    tags TEXT[],
    attachments JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE task_comments (
    id BIGSERIAL PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    comment_text TEXT NOT NULL,
    mentions UUID[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUDIT
-- =====================================================

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    user_email VARCHAR(255),
    ip_address INET,
    session_id UUID,
    action_type VARCHAR(50) CHECK (action_type IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'EXECUTE')),
    entity_type VARCHAR(100),
    entity_id UUID,
    entity_name VARCHAR(200),
    action_description TEXT,
    changes JSONB,
    old_values JSONB,
    new_values JSONB,
    request_method VARCHAR(10),
    request_url TEXT,
    user_agent TEXT,
    status VARCHAR(20) CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL', 'DENIED')),
    error_message TEXT,
    execution_time_ms INTEGER
);

-- =====================================================
-- PARAMÈTRES
-- =====================================================

CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'STRING' CHECK (setting_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY')),
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE company_settings (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'STRING',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    UNIQUE(company_id, setting_key)
);

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('system.name', 'LogSys CRM', 'STRING', 'Nom du système'),
('system.logo', 'LogSys', 'STRING', 'Logo du système'),
('system.footer', 'From G-tech', 'STRING', 'Texte du footer'),
('system.primary_color', '#E6F3FF', 'STRING', 'Couleur primaire (bleu clair)'),
('system.default_language', 'fr', 'STRING', 'Langue par défaut'),
('system.timezone', 'UTC', 'STRING', 'Fuseau horaire par défaut'),
('security.password_min_length', '8', 'NUMBER', 'Longueur minimale du mot de passe'),
('security.session_timeout_minutes', '480', 'NUMBER', 'Délai d''expiration de session'),
('security.max_login_attempts', '5', 'NUMBER', 'Nombre maximal de tentatives de connexion'),
('notification.email_sender', 'noreply@logsys.com', 'STRING', 'Adresse email d''envoi des notifications'),
('notification.sms_provider', 'TWILIO', 'STRING', 'Fournisseur de service SMS');

-- =====================================================
-- PLAN COMPTABLE OHADA
-- =====================================================

CREATE TABLE chart_of_accounts_ohada (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(20) CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    parent_account_number VARCHAR(20) REFERENCES chart_of_accounts_ohada(account_number),
    hierarchy_level INTEGER NOT NULL,
    is_heading BOOLEAN DEFAULT false,
    ohada_class VARCHAR(2),
    is_debit_normal BOOLEAN DEFAULT true,
    allows_direct_posting BOOLEAN DEFAULT true,
    requires_auxiliary BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO chart_of_accounts_ohada (account_number, account_name, account_type, hierarchy_level, is_heading, ohada_class, is_debit_normal, allows_direct_posting) VALUES
('10', 'CAPITAL', 'EQUITY', 1, true, '1', false, false),
('101', 'Capital social', 'EQUITY', 2, false, '1', false, true),
('11', 'RÉSERVES', 'EQUITY', 1, true, '1', false, false),
('111', 'Réserve légale', 'EQUITY', 2, false, '1', false, true),
('12', 'REPORT À NOUVEAU', 'EQUITY', 1, true, '1', false, false),
('121', 'Report à nouveau créditeur', 'EQUITY', 2, false, '1', false, true),
('129', 'Report à nouveau débiteur', 'EQUITY', 2, false, '1', true, true),
('13', 'RÉSULTAT NET DE L''EXERCICE', 'EQUITY', 1, true, '1', false, false),
('131', 'Résultat net : bénéfice', 'EQUITY', 2, false, '1', false, true),
('139', 'Résultat net : perte', 'EQUITY', 2, false, '1', true, true),
('16', 'EMPRUNTS ET DETTES ASSIMILÉES', 'LIABILITY', 1, true, '1', false, false),
('163', 'Emprunts auprès des établissements de crédit', 'LIABILITY', 2, false, '1', false, true),
('20', 'IMMOBILISATIONS INCORPORELLES', 'ASSET', 1, true, '2', true, false),
('204', 'Logiciels informatiques', 'ASSET', 2, false, '2', true, true),
('21', 'IMMOBILISATIONS CORPORELLES', 'ASSET', 1, true, '2', true, false),
('211', 'Terrains', 'ASSET', 2, false, '2', true, true),
('212', 'Bâtiments', 'ASSET', 2, false, '2', true, true),
('213', 'Installations techniques, matériel et outillage', 'ASSET', 2, false, '2', true, true),
('214', 'Matériel de transport', 'ASSET', 2, false, '2', true, true),
('215', 'Mobilier, matériel de bureau et aménagements', 'ASSET', 2, false, '2', true, true),
('28', 'AMORTISSEMENTS DES IMMOBILISATIONS', 'ASSET', 1, true, '2', false, false),
('281', 'Amortissements des immobilisations corporelles', 'ASSET', 2, false, '2', false, true),
('31', 'MARCHANDISES', 'ASSET', 1, true, '3', true, false),
('311', 'Marchandises', 'ASSET', 2, false, '3', true, true),
('32', 'MATIÈRES PREMIÈRES ET FOURNITURES', 'ASSET', 1, true, '3', true, false),
('321', 'Matières premières', 'ASSET', 2, false, '3', true, true),
('40', 'FOURNISSEURS ET COMPTES RATTACHÉS', 'LIABILITY', 1, true, '4', false, false),
('401', 'Fournisseurs - Achats de biens et services', 'LIABILITY', 2, false, '4', false, true),
('41', 'CLIENTS ET COMPTES RATTACHÉS', 'ASSET', 1, true, '4', true, false),
('411', 'Clients - Ventes de biens et services', 'ASSET', 2, false, '4', true, true),
('42', 'PERSONNEL', 'LIABILITY', 1, true, '4', false, false),
('421', 'Personnel - Rémunérations dues', 'LIABILITY', 2, false, '4', false, true),
('43', 'ORGANISMES SOCIAUX', 'LIABILITY', 1, true, '4', false, false),
('431', 'Sécurité sociale', 'LIABILITY', 2, false, '4', false, true),
('44', 'ÉTAT ET COLLECTIVITÉS PUBLIQUES', 'LIABILITY', 1, true, '4', false, false),
('441', 'État - Impôts et taxes', 'LIABILITY', 2, false, '4', false, true),
('445', 'État - TVA', 'LIABILITY', 2, false, '4', false, true),
('51', 'BANQUES, ÉTABLISSEMENTS FINANCIERS', 'ASSET', 1, true, '5', true, false),
('511', 'Banques - Comptes courants', 'ASSET', 2, false, '5', true, true),
('52', 'CAISSE', 'ASSET', 1, true, '5', true, false),
('521', 'Caisse', 'ASSET', 2, false, '5', true, true),
('60', 'ACHATS', 'EXPENSE', 1, true, '6', true, false),
('601', 'Achats de marchandises', 'EXPENSE', 2, false, '6', true, true),
('602', 'Achats de matières premières', 'EXPENSE', 2, false, '6', true, true),
('62', 'SERVICES EXTÉRIEURS', 'EXPENSE', 1, true, '6', true, false),
('622', 'Locations et charges locatives', 'EXPENSE', 2, false, '6', true, true),
('624', 'Primes d''assurance', 'EXPENSE', 2, false, '6', true, true),
('626', 'Honoraires', 'EXPENSE', 2, false, '6', true, true),
('64', 'IMPÔTS ET TAXES', 'EXPENSE', 1, true, '6', true, false),
('641', 'Impôts et taxes directs', 'EXPENSE', 2, false, '6', true, true),
('65', 'CHARGES DE PERSONNEL', 'EXPENSE', 1, true, '6', true, false),
('651', 'Rémunérations du personnel', 'EXPENSE', 2, false, '6', true, true),
('652', 'Charges sociales', 'EXPENSE', 2, false, '6', true, true),
('67', 'CHARGES FINANCIÈRES', 'EXPENSE', 1, true, '6', true, false),
('671', 'Intérêts des emprunts', 'EXPENSE', 2, false, '6', true, true),
('68', 'DOTATIONS AUX AMORTISSEMENTS', 'EXPENSE', 1, true, '6', true, false),
('681', 'Dotations aux amortissements', 'EXPENSE', 2, false, '6', true, true),
('70', 'VENTES', 'REVENUE', 1, true, '7', false, false),
('701', 'Ventes de marchandises', 'REVENUE', 2, false, '7', false, true),
('702', 'Ventes de produits finis', 'REVENUE', 2, false, '7', false, true),
('706', 'Prestations de services', 'REVENUE', 2, false, '7', false, true),
('75', 'PRODUITS FINANCIERS', 'REVENUE', 1, true, '7', false, false),
('751', 'Intérêts de prêts', 'REVENUE', 2, false, '7', false, true);

-- =====================================================
-- MODULE COMPTABLE
-- =====================================================

CREATE TABLE accounting_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    period_code VARCHAR(20) NOT NULL,
    period_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    closed_at TIMESTAMP,
    closed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, period_code)
);

CREATE TABLE accounting_journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    journal_code VARCHAR(10) NOT NULL,
    journal_name VARCHAR(100) NOT NULL,
    journal_type VARCHAR(20) CHECK (journal_type IN ('GENERAL', 'SALES', 'PURCHASES', 'BANK', 'CASH', 'PAYROLL')),
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, journal_code)
);

CREATE TABLE accounting_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    entry_number VARCHAR(50) NOT NULL,
    period_id UUID REFERENCES accounting_periods(id),
    journal_id UUID REFERENCES accounting_journals(id),
    entry_date DATE NOT NULL,
    posting_date DATE,
    document_date DATE,
    reference_number VARCHAR(100),
    document_type VARCHAR(50),
    description TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'VALIDATED', 'REVERSED')),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    posted_by UUID REFERENCES users(id),
    posted_at TIMESTAMP,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(company_id, entry_number)
);

CREATE TABLE auxiliary_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(20) CHECK (account_type IN ('CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'BANK', 'OTHER')),
    control_account_number VARCHAR(20) REFERENCES chart_of_accounts_ohada(account_number),
    legal_name VARCHAR(200),
    tax_id VARCHAR(100),
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    country_id INTEGER REFERENCES countries(id),
    payment_terms VARCHAR(50),
    credit_limit DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    current_balance DECIMAL(15,2) DEFAULT 0,
    last_activity_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, account_code)
);

CREATE TABLE accounting_entry_lines (
    id BIGSERIAL PRIMARY KEY,
    entry_id UUID REFERENCES accounting_entries(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    account_number VARCHAR(20) REFERENCES chart_of_accounts_ohada(account_number),
    auxiliary_account_id UUID REFERENCES auxiliary_accounts(id),
    description TEXT,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    amount_currency DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    transaction_ref_type VARCHAR(50),
    transaction_ref_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entry_id, line_number)
);

CREATE TABLE customer_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES auxiliary_accounts(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    accounting_entry_id UUID REFERENCES accounting_entries(id),
    items JSONB DEFAULT '[]',
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(company_id, invoice_number)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    payment_number VARCHAR(50) NOT NULL,
    payment_type VARCHAR(20) CHECK (payment_type IN ('CUSTOMER_PAYMENT', 'SUPPLIER_PAYMENT', 'EXPENSE_PAYMENT')),
    payment_method VARCHAR(30) CHECK (payment_method IN ('CASH', 'CHECK', 'BANK_TRANSFER', 'CREDIT_CARD', 'MOBILE_MONEY')),
    payer_id UUID REFERENCES auxiliary_accounts(id),
    payee_id UUID REFERENCES auxiliary_accounts(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    bank_account_id UUID,
    check_number VARCHAR(50),
    transaction_reference VARCHAR(100),
    accounting_entry_id UUID REFERENCES accounting_entries(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(company_id, payment_number)
);

CREATE TABLE payment_allocations (
    id BIGSERIAL PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES customer_invoices(id) ON DELETE CASCADE,
    allocated_amount DECIMAL(15,2) NOT NULL,
    discount_taken DECIMAL(15,2) DEFAULT 0,
    allocation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- MODULE LOGISTIQUE
-- =====================================================

CREATE TABLE logistic_categories (
    id SERIAL PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_code VARCHAR(50) NOT NULL,
    category_name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES logistic_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, category_code)
);

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_code VARCHAR(50) NOT NULL,
    warehouse_name VARCHAR(200) NOT NULL,
    warehouse_type VARCHAR(50) CHECK (warehouse_type IN ('MAIN', 'DISTRIBUTION', 'TEMPORARY', 'TRANSIT')),
    address TEXT NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country_id INTEGER REFERENCES countries(id),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    capacity_cubic_meters DECIMAL(10,2),
    capacity_pallets INTEGER,
    capacity_units INTEGER,
    contact_person VARCHAR(200),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    operating_hours JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, warehouse_code)
);

CREATE TABLE logistic_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(500) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES logistic_categories(id),
    item_type VARCHAR(20) CHECK (item_type IN ('RAW_MATERIAL', 'FINISHED_GOOD', 'SEMI_FINISHED', 'SERVICE', 'PACKAGING')),
    unit_of_measure VARCHAR(20) NOT NULL,
    weight_kg DECIMAL(10,3),
    volume_m3 DECIMAL(10,3),
    dimensions JSONB,
    min_stock_level DECIMAL(10,2),
    max_stock_level DECIMAL(10,2),
    reorder_point DECIMAL(10,2),
    lead_time_days INTEGER,
    requires_batch_tracking BOOLEAN DEFAULT false,
    requires_serial_tracking BOOLEAN DEFAULT false,
    requires_expiry_tracking BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, item_code)
);

CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id),
    item_id UUID REFERENCES logistic_items(id),
    quantity_on_hand DECIMAL(10,2) DEFAULT 0,
    quantity_reserved DECIMAL(10,2) DEFAULT 0,
    quantity_available DECIMAL(10,2) DEFAULT 0,
    quantity_in_transit DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(10,2),
    location_code VARCHAR(100),
    zone VARCHAR(50),
    aisle VARCHAR(20),
    rack VARCHAR(20),
    shelf VARCHAR(20),
    bin VARCHAR(20),
    last_counted_at TIMESTAMP,
    last_movement_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, item_id)
);

CREATE TABLE inventory_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    item_id UUID REFERENCES logistic_items(id),
    batch_number VARCHAR(100) NOT NULL,
    production_date DATE,
    expiry_date DATE,
    quantity_produced DECIMAL(10,2),
    quantity_remaining DECIMAL(10,2),
    supplier_id UUID,
    supplier_batch_number VARCHAR(100),
    quality_check_status VARCHAR(20) CHECK (quality_check_status IN ('PENDING', 'PASSED', 'FAILED', 'QUARANTINED')),
    quality_check_date DATE,
    quality_check_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(company_id, batch_number)
);

CREATE TABLE inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    movement_code VARCHAR(50) UNIQUE,
    movement_type VARCHAR(20) CHECK (movement_type IN ('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'PRODUCTION')),
    from_warehouse_id UUID REFERENCES warehouses(id),
    to_warehouse_id UUID REFERENCES warehouses(id),
    item_id UUID REFERENCES logistic_items(id),
    batch_id UUID REFERENCES inventory_batches(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_type VARCHAR(50),
    reference_id UUID,
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    completed_by UUID REFERENCES users(id)
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_reference VARCHAR(100),
    warehouse_id UUID REFERENCES warehouses(id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_lines (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES logistic_items(id),
    line_number INTEGER NOT NULL,
    description TEXT,
    quantity_ordered DECIMAL(10,2) NOT NULL,
    quantity_received DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    line_total DECIMAL(10,2),
    expected_delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(purchase_order_id, line_number)
);

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    shipment_number VARCHAR(50) NOT NULL UNIQUE,
    shipment_type VARCHAR(20) CHECK (shipment_type IN ('INBOUND', 'OUTBOUND', 'TRANSFER')),
    carrier_id UUID,
    carrier_name VARCHAR(200),
    tracking_number VARCHAR(100),
    transport_mode VARCHAR(20) CHECK (transport_mode IN ('ROAD', 'RAIL', 'AIR', 'SEA', 'MULTIMODAL')),
    scheduled_departure TIMESTAMP,
    actual_departure TIMESTAMP,
    scheduled_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    origin_warehouse_id UUID REFERENCES warehouses(id),
    destination_warehouse_id UUID REFERENCES warehouses(id),
    origin_address TEXT,
    destination_address TEXT,
    status VARCHAR(20) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_TRANSIT', 'DELAYED', 'DELIVERED', 'CANCELLED')),
    documents JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- VUES
-- =====================================================

CREATE VIEW expiring_subscriptions AS
SELECT 
    cs.id,
    cs.company_id,
    c.name AS company_name,
    c.email AS company_email,
    cs.end_date,
    cs.next_billing_date,
    cs.total_amount,
    (cs.end_date - CURRENT_DATE) AS days_remaining,
    sp.name AS plan_name,
    cs.status
FROM company_subscriptions cs
JOIN companies c ON c.id = cs.company_id
JOIN subscription_plans sp ON sp.id = cs.plan_id
WHERE cs.status = 'ACTIVE'
AND cs.end_date - CURRENT_DATE <= 10
AND cs.end_date >= CURRENT_DATE;

-- =====================================================
-- FONCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION generate_temporary_password()
RETURNS VARCHAR(12) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    password VARCHAR(12) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..12 LOOP
        password := password || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN password;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEX
-- =====================================================

CREATE INDEX idx_companies_name ON companies USING gin (name gin_trgm_ops);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_tax_number ON companies(tax_number);
CREATE INDEX idx_subscriptions_company_id ON company_subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON company_subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON company_subscriptions(end_date);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE status = 'UNREAD';
CREATE INDEX idx_tasks_assigned_status ON tasks(assigned_to, status);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_documents_search ON documents USING gin(indexed_content);
CREATE INDEX idx_documents_title ON documents USING gin (title gin_trgm_ops);
CREATE INDEX idx_audit_timestamp ON audit_logs(log_timestamp DESC);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_company_id ON audit_logs(company_id);
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_meetings_status ON meetings(status);

-- =====================================================
-- DONNÉES INITIALES - ADMIN SYSTÈME
-- =====================================================

-- Insérer l'utilisateur admin système
DO $$
DECLARE
    admin_type_id INTEGER;
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_type_id FROM user_types WHERE code = 'SYS_ADMIN';
    
    IF admin_type_id IS NOT NULL THEN
        INSERT INTO users (
            id, user_code, email, first_name, last_name, full_name,
            user_type_id, is_system_admin, is_company_admin,
            password_hash, is_temporary_password, status, email_verified
        ) VALUES (
            uuid_generate_v4(), 'ADMIN001', 'admin@logsys.com',
            'Admin', 'System', 'Admin System',
            admin_type_id, true, false,
            crypt('Admin@2024', gen_salt('bf', 12)), false, 'ACTIVE', true
        ) ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- COMMENTAIRE
-- =====================================================

COMMENT ON DATABASE logsys_db IS 'Base de données LogSys CRM - Système multi-entreprise avec modules Messagerie, Réunions, Logistique et Comptabilité OHADA';

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================