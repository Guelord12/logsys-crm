module.exports = (sequelize, DataTypes) => {
  const AccountingPeriod = sequelize.define('AccountingPeriod', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,  // ✅ Permettre null pour l'admin système
      field: 'company_id',
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    periodCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'period_code'
    },
    periodName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'period_name'
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
    isClosed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_closed'
    },
    closedAt: {
      type: DataTypes.DATE,
      field: 'closed_at'
    },
    closedBy: {
      type: DataTypes.UUID,
      field: 'closed_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'accounting_periods',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: false
  });

  AccountingPeriod.associate = (models) => {
    AccountingPeriod.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    AccountingPeriod.hasMany(models.AccountingEntry, {
      foreignKey: 'periodId',
      as: 'entries'
    });
    
    AccountingPeriod.belongsTo(models.User, {
      foreignKey: 'closedBy',
      as: 'closer'
    });
  };

  return AccountingPeriod;
};