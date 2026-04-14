module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
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
    paymentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'payment_number'
    },
    paymentType: {
      type: DataTypes.ENUM('CUSTOMER_PAYMENT', 'SUPPLIER_PAYMENT', 'EXPENSE_PAYMENT'),
      allowNull: false,
      field: 'payment_type'
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'CHECK', 'BANK_TRANSFER', 'CREDIT_CARD', 'MOBILE_MONEY'),
      allowNull: false,
      field: 'payment_method'
    },
    payerId: {
      type: DataTypes.UUID,
      field: 'payer_id',
      references: {
        model: 'auxiliary_accounts',
        key: 'id'
      }
    },
    payeeId: {
      type: DataTypes.UUID,
      field: 'payee_id',
      references: {
        model: 'auxiliary_accounts',
        key: 'id'
      }
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'payment_date'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    bankAccountId: {
      type: DataTypes.UUID,
      field: 'bank_account_id'
    },
    checkNumber: {
      type: DataTypes.STRING(50),
      field: 'check_number'
    },
    transactionReference: {
      type: DataTypes.STRING(100),
      field: 'transaction_reference'
    },
    accountingEntryId: {
      type: DataTypes.UUID,
      field: 'accounting_entry_id',
      references: {
        model: 'accounting_entries',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
      defaultValue: 'PENDING'
    },
    notes: {
      type: DataTypes.TEXT
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'payments',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',   // ✅ Colonne existante
    updatedAt: false,          // ✅ Désactivé (n'existe pas)
    paranoid: true,            // ✅ Activé (deleted_at existe)
    deletedAt: 'deleted_at'    // ✅ Colonne existante
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    Payment.belongsTo(models.AuxiliaryAccount, {
      foreignKey: 'payerId',
      as: 'payer'
    });
    
    Payment.belongsTo(models.AuxiliaryAccount, {
      foreignKey: 'payeeId',
      as: 'payee'
    });
    
    Payment.belongsTo(models.AccountingEntry, {
      foreignKey: 'accountingEntryId',
      as: 'accountingEntry'
    });
    
    Payment.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    Payment.hasMany(models.PaymentAllocation, {
      foreignKey: 'paymentId',
      as: 'allocations'
    });
  };

  return Payment;
};