module.exports = (sequelize, DataTypes) => {
  const PaymentAllocation = sequelize.define('PaymentAllocation', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'payment_id',
      references: {
        model: 'payments',
        key: 'id'
      }
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'invoice_id',
      references: {
        model: 'customer_invoices',
        key: 'id'
      }
    },
    allocatedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'allocated_amount'
    },
    discountTaken: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'discount_taken'
    },
    allocationDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      field: 'allocation_date'
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
    tableName: 'payment_allocations',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',   // ✅ Colonne existante
    updatedAt: false,          // ✅ Désactivé (n'existe pas)
    paranoid: false            // ✅ Désactivé (deleted_at n'existe pas)
  });

  PaymentAllocation.associate = (models) => {
    PaymentAllocation.belongsTo(models.Payment, {
      foreignKey: 'paymentId',
      as: 'payment'
    });
    
    PaymentAllocation.belongsTo(models.CustomerInvoice, {
      foreignKey: 'invoiceId',
      as: 'invoice'
    });
    
    PaymentAllocation.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return PaymentAllocation;
};