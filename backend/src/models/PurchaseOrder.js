module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define('PurchaseOrder', {
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
    poNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'po_number'
    },
    supplierId: {
      type: DataTypes.UUID,
      field: 'supplier_id'
    },
    supplierName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'supplier_name'
    },
    supplierReference: {
      type: DataTypes.STRING(100),
      field: 'supplier_reference'
    },
    warehouseId: {
      type: DataTypes.UUID,
      field: 'warehouse_id',
      references: {
        model: 'warehouses',
        key: 'id'
      }
    },
    orderDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'order_date'
    },
    expectedDeliveryDate: {
      type: DataTypes.DATEONLY,
      field: 'expected_delivery_date'
    },
    actualDeliveryDate: {
      type: DataTypes.DATEONLY,
      field: 'actual_delivery_date'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'tax_amount'
    },
    shippingCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'shipping_cost'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'total_amount'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'DRAFT'
    },
    approvedBy: {
      type: DataTypes.UUID,
      field: 'approved_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      field: 'approved_at'
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
    }
  }, {
    tableName: 'purchase_orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: false
  });

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    PurchaseOrder.belongsTo(models.Warehouse, {
      foreignKey: 'warehouseId',
      as: 'warehouse'
    });
    
    PurchaseOrder.hasMany(models.PurchaseOrderLine, {
      foreignKey: 'purchaseOrderId',
      as: 'lines'
    });
    
    PurchaseOrder.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    PurchaseOrder.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver'
    });
  };

  return PurchaseOrder;
};