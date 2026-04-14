module.exports = (sequelize, DataTypes) => {
  const PurchaseOrderLine = sequelize.define('PurchaseOrderLine', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    purchaseOrderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'purchase_order_id',
      references: {
        model: 'purchase_orders',
        key: 'id'
      }
    },
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'item_id',
      references: {
        model: 'logistic_items',
        key: 'id'
      }
    },
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'line_number'
    },
    description: {
      type: DataTypes.TEXT
    },
    quantityOrdered: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'quantity_ordered'
    },
    quantityReceived: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'quantity_received'
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price'
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      field: 'tax_rate'
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      field: 'discount_percent'
    },
    lineTotal: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'line_total'
    },
    expectedDeliveryDate: {
      type: DataTypes.DATEONLY,
      field: 'expected_delivery_date'
    }
  }, {
    tableName: 'purchase_order_lines',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: false,
    hooks: {
      beforeCreate: (line) => {
        line.lineTotal = line.quantityOrdered * line.unitPrice * (1 - line.discountPercent / 100) * (1 + line.taxRate / 100);
      },
      beforeUpdate: (line) => {
        if (line.changed('quantityOrdered') || line.changed('unitPrice') || line.changed('discountPercent') || line.changed('taxRate')) {
          line.lineTotal = line.quantityOrdered * line.unitPrice * (1 - line.discountPercent / 100) * (1 + line.taxRate / 100);
        }
      }
    }
  });

  PurchaseOrderLine.associate = (models) => {
    PurchaseOrderLine.belongsTo(models.PurchaseOrder, {
      foreignKey: 'purchaseOrderId',
      as: 'purchaseOrder'
    });
    
    PurchaseOrderLine.belongsTo(models.LogisticItem, {
      foreignKey: 'itemId',
      as: 'item'
    });
  };

  return PurchaseOrderLine;
};