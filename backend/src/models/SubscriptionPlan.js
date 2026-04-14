// backend/src/models/SubscriptionPlan.js

module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_users'
    },
    pricePerUser: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'price_per_user'
    },
    billingCycle: {
      type: DataTypes.ENUM('MONTHLY', 'QUARTERLY', 'YEARLY'),
      defaultValue: 'MONTHLY',
      field: 'billing_cycle'
    },
    isFree: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_free'
    },
    features: {
      type: DataTypes.JSONB
    }
  }, {
    tableName: 'subscription_plans',
    underscored: true,
    timestamps: true,
    paranoid: false  // IMPORTANT: Désactiver le soft delete
  });

  SubscriptionPlan.associate = (models) => {
    if (models.CompanySubscription) {
      SubscriptionPlan.hasMany(models.CompanySubscription, {
        foreignKey: 'planId',
        as: 'subscriptions'
      });
    }
    
    if (models.SystemModule) {
      SubscriptionPlan.belongsToMany(models.SystemModule, {
        through: 'plan_modules',
        foreignKey: 'planId',
        as: 'modules'
      });
    }
  };

  return SubscriptionPlan;
};