module.exports = (sequelize, DataTypes) => {
  const CompanySubscription = sequelize.define('CompanySubscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id',
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'plan_id',
      references: {
        model: 'subscription_plans',
        key: 'id'
      }
    },
    subscriptionNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'subscription_number'
    },
    userCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_count'
    },
    pricePerUser: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'price_per_user'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date'
    },
    nextBillingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'next_billing_date'
    },
    paymentDueDate: {
      type: DataTypes.DATEONLY,
      field: 'payment_due_date'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'PENDING_PAYMENT'),
      defaultValue: 'PENDING_PAYMENT'
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'auto_renew'
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      field: 'cancellation_reason'
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      field: 'payment_method'
    },
    lastPaymentDate: {
      type: DataTypes.DATE,
      field: 'last_payment_date'
    },
    lastPaymentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'last_payment_amount'
    },
    paymentTransactionId: {
      type: DataTypes.STRING(255),
      field: 'payment_transaction_id'
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cancelledAt: {
      type: DataTypes.DATE,
      field: 'cancelled_at'
    },
    cancelledBy: {
      type: DataTypes.UUID,
      field: 'cancelled_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'company_subscriptions',
    underscored: true,
    timestamps: true,
    paranoid: false,  // IMPORTANT: Désactiver le soft delete
    hooks: {
      beforeCreate: async (subscription) => {
        if (!subscription.subscriptionNumber) {
          subscription.subscriptionNumber = `SUB${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        }
      }
    }
  });

  CompanySubscription.associate = (models) => {
    if (models.Company) {
      CompanySubscription.belongsTo(models.Company, {
        foreignKey: 'companyId',
        as: 'company'
      });
    }

    if (models.SubscriptionPlan) {
      CompanySubscription.belongsTo(models.SubscriptionPlan, {
        foreignKey: 'planId',
        as: 'plan'
      });
    }

    if (models.User) {
      CompanySubscription.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });

      CompanySubscription.belongsTo(models.User, {
        foreignKey: 'cancelledBy',
        as: 'canceller'
      });
    }

    if (models.SubscriptionNotification) {
      CompanySubscription.hasMany(models.SubscriptionNotification, {
        foreignKey: 'companySubscriptionId',
        as: 'notifications'
      });
    }
  };

  return CompanySubscription;
};