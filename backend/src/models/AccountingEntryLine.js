module.exports = (sequelize, DataTypes) => {
  const AccountingEntryLine = sequelize.define('AccountingEntryLine', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    entryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'entry_id',
      references: {
        model: 'accounting_entries',
        key: 'id'
      }
    },
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'line_number'
    },
    accountNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'account_number',
      references: {
        model: 'chart_of_accounts_ohada',
        key: 'account_number'
      }
    },
    auxiliaryAccountId: {
      type: DataTypes.UUID,
      field: 'auxiliary_account_id',
      references: {
        model: 'auxiliary_accounts',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    debitAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'debit_amount'
    },
    creditAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'credit_amount'
    },
    amountCurrency: {
      type: DataTypes.DECIMAL(15, 2),
      field: 'amount_currency'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 1,
      field: 'exchange_rate'
    },
    transactionRefType: {
      type: DataTypes.STRING(50),
      field: 'transaction_ref_type'
    },
    transactionRefId: {
      type: DataTypes.UUID,
      field: 'transaction_ref_id'
    }
  }, {
    tableName: 'accounting_entry_lines',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',   // ✅ Colonne existante
    updatedAt: false,          // ✅ Désactivé (n'existe pas)
    paranoid: false            // ✅ Désactivé (deleted_at n'existe pas)
  });

  AccountingEntryLine.associate = (models) => {
    AccountingEntryLine.belongsTo(models.AccountingEntry, {
      foreignKey: 'entryId',
      as: 'entry'
    });
    
    AccountingEntryLine.belongsTo(models.ChartOfAccountsOhada, {
      foreignKey: 'accountNumber',
      targetKey: 'accountNumber',
      as: 'account'
    });
    
    AccountingEntryLine.belongsTo(models.AuxiliaryAccount, {
      foreignKey: 'auxiliaryAccountId',
      as: 'auxiliaryAccount'
    });
  };

  return AccountingEntryLine;
};