module.exports = (sequelize, DataTypes) => {
  const LogisticItem = sequelize.define('LogisticItem', {
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
    itemCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'item_code'
    },
    itemName: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'item_name'
    },
    description: {
      type: DataTypes.TEXT
    },
    categoryId: {
      type: DataTypes.INTEGER,
      field: 'category_id',
      references: {
        model: 'logistic_categories',
        key: 'id'
      }
    },
    itemType: {
      type: DataTypes.ENUM('RAW_MATERIAL', 'FINISHED_GOOD', 'SEMI_FINISHED', 'SERVICE', 'PACKAGING'),
      field: 'item_type'
    },
    unitOfMeasure: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'unit_of_measure'
    },
    weightKg: {
      type: DataTypes.DECIMAL(10, 3),
      field: 'weight_kg'
    },
    volumeM3: {
      type: DataTypes.DECIMAL(10, 3),
      field: 'volume_m3'
    },
    dimensions: {
      type: DataTypes.JSONB
    },
    minStockLevel: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'min_stock_level'
    },
    maxStockLevel: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'max_stock_level'
    },
    reorderPoint: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'reorder_point'
    },
    leadTimeDays: {
      type: DataTypes.INTEGER,
      field: 'lead_time_days'
    },
    requiresBatchTracking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'requires_batch_tracking'
    },
    requiresSerialTracking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'requires_serial_tracking'
    },
    requiresExpiryTracking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'requires_expiry_tracking'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'logistic_items',
    underscored: true,
    timestamps: true
  });

  LogisticItem.associate = (models) => {
    LogisticItem.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    LogisticItem.belongsTo(models.LogisticCategory, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    
    LogisticItem.hasMany(models.Inventory, {
      foreignKey: 'itemId',
      as: 'inventory'
    });
    
    LogisticItem.hasMany(models.InventoryMovement, {
      foreignKey: 'itemId',
      as: 'movements'
    });
    
    LogisticItem.hasMany(models.PurchaseOrderLine, {
      foreignKey: 'itemId',
      as: 'purchaseOrderLines'
    });
  };

  return LogisticItem;
};