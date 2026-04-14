module.exports = (sequelize, DataTypes) => {
  const ChartOfAccountsOhada = sequelize.define('ChartOfAccountsOhada', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    accountNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'account_number'
    },
    accountName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'account_name'
    },
    accountType: {
      type: DataTypes.ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'),
      allowNull: false,
      field: 'account_type'
    },
    parentAccountNumber: {
      type: DataTypes.STRING(20),
      field: 'parent_account_number',
      references: {
        model: 'chart_of_accounts_ohada',
        key: 'account_number'
      }
    },
    hierarchyLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'hierarchy_level'
    },
    isHeading: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_heading'
    },
    ohadaClass: {
      type: DataTypes.STRING(2),
      field: 'ohada_class'
    },
    ohadaCategory: {
      type: DataTypes.STRING(50),
      field: 'ohada_category'
    },
    isDebitNormal: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_debit_normal'
    },
    allowsDirectPosting: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'allows_direct_posting'
    },
    requiresAuxiliary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'requires_auxiliary'
    },
    description: {
      type: DataTypes.TEXT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'chart_of_accounts_ohada',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',   // ✅ Colonne existante
    updatedAt: false,          // ✅ Désactivé (n'existe pas)
    paranoid: false            // ✅ Désactivé (deleted_at n'existe pas)
  });

  ChartOfAccountsOhada.associate = (models) => {
    ChartOfAccountsOhada.belongsTo(models.ChartOfAccountsOhada, {
      foreignKey: 'parentAccountNumber',
      targetKey: 'accountNumber',
      as: 'parent'
    });
    
    ChartOfAccountsOhada.hasMany(models.ChartOfAccountsOhada, {
      foreignKey: 'parentAccountNumber',
      sourceKey: 'accountNumber',
      as: 'children'
    });
    
    ChartOfAccountsOhada.hasMany(models.AccountingEntryLine, {
      foreignKey: 'accountNumber',
      sourceKey: 'accountNumber',
      as: 'entryLines'
    });
    
    ChartOfAccountsOhada.hasMany(models.AuxiliaryAccount, {
      foreignKey: 'controlAccountNumber',
      sourceKey: 'accountNumber',
      as: 'auxiliaryAccounts'
    });
  };

  return ChartOfAccountsOhada;
};