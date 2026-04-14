module.exports = (sequelize, DataTypes) => {
  const AccountingEntry = sequelize.define('AccountingEntry', {
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
    entryNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'entry_number'
    },
    periodId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'period_id',
      references: {
        model: 'accounting_periods',
        key: 'id'
      }
    },
    journalId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'journal_id',
      references: {
        model: 'accounting_journals',
        key: 'id'
      }
    },
    entryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'entry_date'
    },
    postingDate: {
      type: DataTypes.DATEONLY,
      field: 'posting_date'
    },
    documentDate: {
      type: DataTypes.DATEONLY,
      field: 'document_date'
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      field: 'reference_number'
    },
    documentType: {
      type: DataTypes.STRING(50),
      field: 'document_type'
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'POSTED', 'VALIDATED', 'REVERSED'),
      defaultValue: 'DRAFT'
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_recurring'
    },
    recurrencePattern: {
      type: DataTypes.JSONB,
      field: 'recurrence_pattern'
    },
    postedBy: {
      type: DataTypes.UUID,
      field: 'posted_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    postedAt: {
      type: DataTypes.DATE,
      field: 'posted_at'
    },
    validatedBy: {
      type: DataTypes.UUID,
      field: 'validated_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    validatedAt: {
      type: DataTypes.DATE,
      field: 'validated_at'
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
    tableName: 'accounting_entries',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',   // ✅ Colonne existante
    updatedAt: false,          // ✅ Désactivé (n'existe pas)
    paranoid: false            // ✅ Désactivé (n'existe pas)
  });

  AccountingEntry.associate = (models) => {
    AccountingEntry.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    AccountingEntry.belongsTo(models.AccountingPeriod, {
      foreignKey: 'periodId',
      as: 'period'
    });
    
    AccountingEntry.belongsTo(models.AccountingJournal, {
      foreignKey: 'journalId',
      as: 'journal'
    });
    
    AccountingEntry.hasMany(models.AccountingEntryLine, {
      foreignKey: 'entryId',
      as: 'lines'
    });
    
    AccountingEntry.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    AccountingEntry.belongsTo(models.User, {
      foreignKey: 'postedBy',
      as: 'poster'
    });
  };

  return AccountingEntry;
};