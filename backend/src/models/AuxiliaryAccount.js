module.exports = (sequelize, DataTypes) => {
  const AuxiliaryAccount = sequelize.define('AuxiliaryAccount', {
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
    accountCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'account_code'
    },
    accountName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'account_name'
    },
    accountType: {
      type: DataTypes.ENUM('CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'BANK', 'OTHER'),
      allowNull: false,
      field: 'account_type'
    },
    controlAccountNumber: {
      type: DataTypes.STRING(20),
      field: 'control_account_number',
      references: {
        model: 'chart_of_accounts_ohada',
        key: 'account_number'
      }
    },
    legalName: {
      type: DataTypes.STRING(200),
      field: 'legal_name'
    },
    taxId: {
      type: DataTypes.STRING(100),
      field: 'tax_id'
    },
    contactPerson: {
      type: DataTypes.STRING(200),
      field: 'contact_person'
    },
    email: {
      type: DataTypes.STRING(255),
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(50)
    },
    address: {
      type: DataTypes.TEXT
    },
    countryId: {
      type: DataTypes.INTEGER,
      field: 'country_id',
      references: {
        model: 'countries',
        key: 'id'
      }
    },
    paymentTerms: {
      type: DataTypes.STRING(50),
      field: 'payment_terms'
    },
    creditLimit: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'credit_limit'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    currentBalance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'current_balance'
    },
    lastActivityDate: {
      type: DataTypes.DATEONLY,
      field: 'last_activity_date'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'auxiliary_accounts',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',   // ✅ Colonne existante
    updatedAt: false,          // ✅ Désactivé (n'existe pas)
    paranoid: false            // ✅ Désactivé (deleted_at n'existe pas)
  });

  AuxiliaryAccount.associate = (models) => {
    AuxiliaryAccount.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    AuxiliaryAccount.belongsTo(models.ChartOfAccountsOhada, {
      foreignKey: 'controlAccountNumber',
      targetKey: 'accountNumber',
      as: 'controlAccount'
    });
    
    AuxiliaryAccount.belongsTo(models.Country, {
      foreignKey: 'countryId',
      as: 'country'
    });
    
    AuxiliaryAccount.hasMany(models.AccountingEntryLine, {
      foreignKey: 'auxiliaryAccountId',
      as: 'entryLines'
    });
    
    AuxiliaryAccount.hasMany(models.CustomerInvoice, {
      foreignKey: 'customerId',
      as: 'invoices'
    });
    
    AuxiliaryAccount.hasMany(models.Payment, {
      foreignKey: 'payerId',
      as: 'paymentsMade'
    });
    
    AuxiliaryAccount.hasMany(models.Payment, {
      foreignKey: 'payeeId',
      as: 'paymentsReceived'
    });
  };

  return AuxiliaryAccount;
};