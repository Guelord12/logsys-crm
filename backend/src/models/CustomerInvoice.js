module.exports = (sequelize, DataTypes) => {
  const CustomerInvoice = sequelize.define('CustomerInvoice', {
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
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'invoice_number'
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id',
      references: {
        model: 'auxiliary_accounts',
        key: 'id'
      }
    },
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'invoice_date'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'due_date'
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'tax_amount'
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'discount_amount'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_amount'
    },
    amountPaid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'amount_paid'
    },
    balanceDue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'balance_due'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'),
      defaultValue: 'DRAFT'
    },
    accountingEntryId: {
      type: DataTypes.UUID,
      field: 'accounting_entry_id',
      references: {
        model: 'accounting_entries',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT
    },
    terms: {
      type: DataTypes.TEXT
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    items: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  }, {
    tableName: 'customer_invoices',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',   // ✅ Colonne existante
    updatedAt: false,          // ✅ Désactivé (n'existe pas)
    paranoid: true,            // ✅ Activé (deleted_at existe)
    deletedAt: 'deleted_at'    // ✅ Colonne existante
  });

  CustomerInvoice.associate = (models) => {
    CustomerInvoice.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    CustomerInvoice.belongsTo(models.AuxiliaryAccount, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    
    CustomerInvoice.belongsTo(models.AccountingEntry, {
      foreignKey: 'accountingEntryId',
      as: 'accountingEntry'
    });
    
    CustomerInvoice.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    CustomerInvoice.hasMany(models.PaymentAllocation, {
      foreignKey: 'invoiceId',
      as: 'paymentAllocations'
    });
  };

  return CustomerInvoice;
};