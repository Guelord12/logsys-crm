module.exports = (sequelize, DataTypes) => {
  const AccountingJournal = sequelize.define('AccountingJournal', {
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
    journalCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'journal_code'
    },
    journalName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'journal_name'
    },
    journalType: {
      type: DataTypes.ENUM('GENERAL', 'SALES', 'PURCHASES', 'BANK', 'CASH', 'PAYROLL'),
      allowNull:26,
      field: 'journal_type'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'accounting_journals',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',   // ✅ Colonne existante
    updatedAt: false,          // ✅ Désactivé (n'existe pas)
    paranoid: false            // ✅ Désactivé (deleted_at n'existe pas)
  });

  AccountingJournal.associate = (models) => {
    AccountingJournal.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    AccountingJournal.hasMany(models.AccountingEntry, {
      foreignKey: 'journalId',
      as: 'entries'
    });
  };

  return AccountingJournal;
};