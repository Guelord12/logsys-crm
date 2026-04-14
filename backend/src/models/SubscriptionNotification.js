module.exports = (sequelize, DataTypes) => {
  const SubscriptionNotification = sequelize.define('SubscriptionNotification', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    companySubscriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_subscription_id'
    },
    notificationId: {
      type: DataTypes.UUID,
      field: 'notification_id'
    },
    notificationType: {
      type: DataTypes.ENUM('EXPIRATION_WARNING', 'EXPIRED', 'RENEWAL', 'PAYMENT_REMINDER'),
      field: 'notification_type'
    },
    daysBeforeExpiry: {
      type: DataTypes.INTEGER,
      field: 'days_before_expiry'
    },
    sentAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'sent_at'
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      field: 'acknowledged_at'
    }
  }, {
    tableName: 'subscription_notifications',
    underscored: true,
    timestamps: false
  });

  SubscriptionNotification.associate = (models) => {
    if (models.CompanySubscription) {
      SubscriptionNotification.belongsTo(models.CompanySubscription, {
        foreignKey: 'companySubscriptionId',
        as: 'subscription'
      });
    }
    if (models.Notification) {
      SubscriptionNotification.belongsTo(models.Notification, {
        foreignKey: 'notificationId',
        as: 'notification'
      });
    }
  };

  return SubscriptionNotification;
};