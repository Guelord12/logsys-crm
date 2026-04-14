const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging ? console.log : false,
    pool: config.database.pool,
    define: config.database.define
  }
);

const db = {};

// Ordre de chargement des modèles (pour éviter les dépendances circulaires)
const modelOrder = [
  'Country',
  'BusinessSector',
  'JobPosition',
  'SystemModule',
  'SubscriptionPlan',
  'UserType',
  'NotificationType',
  'TaskType',
  'Company',
  'User',
  'CompanySubscription',
  'UserSession',
  'LoginHistory',
  'Role',
  'Permission',
  'RolePermission',
  'UserRole',
  'UserPermission',
  'EmailFolder',
  'Message',
  'MessageRecipient',
  'Attachment',
  'Meeting',
  'MeetingParticipant',
  'MeetingRecording',
  'MeetingChat',
  'Notification',
  'NotificationTemplate',
  'SubscriptionNotification',
  'Document',
  'Task',
  'TaskComment',
  'AuditLog',
  'SystemSetting',
  'CompanySetting',
  'ChartOfAccountsOhada',
  'AccountingPeriod',
  'AccountingJournal',
  'AccountingEntry',
  'AuxiliaryAccount',
  'AccountingEntryLine',
  'CustomerInvoice',
  'Payment',
  'PaymentAllocation',
  'LogisticCategory',
  'Warehouse',
  'LogisticItem',
  'Inventory',
  'InventoryBatch',
  'InventoryMovement',
  'PurchaseOrder',
  'PurchaseOrderLine',
  'Shipment'
];

// Charger les modèles dans l'ordre
modelOrder.forEach(modelName => {
  const filePath = path.join(__dirname, `${modelName}.js`);
  if (fs.existsSync(filePath)) {
    const model = require(filePath)(sequelize, DataTypes);
    db[model.name] = model;
  }
});

// Charger les autres modèles qui pourraient exister
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file.slice(-3) === '.js' &&
      !modelOrder.includes(file.slice(0, -3))
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// Appliquer les associations avec gestion d'erreurs
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
    } catch (error) {
      console.warn(`⚠️ Erreur d'association pour ${modelName}:`, error.message);
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;