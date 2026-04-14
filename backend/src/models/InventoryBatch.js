module.exports = (sequelize, DataTypes) => {
  const InventoryBatch = sequelize.define('InventoryBatch', {
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
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'item_id',
      references: {
        model: 'logistic_items',
        key: 'id'
      }
    },
    batchNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'batch_number'
    },
    productionDate: {
      type: DataTypes.DATEONLY,
      field: 'production_date'
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      field: 'expiry_date'
    },
    quantityProduced: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'quantity_produced'
    },
    quantityRemaining: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'quantity_remaining'
    },
    supplierId: {
      type: DataTypes.UUID,
      field: 'supplier_id'
    },
    supplierBatchNumber: {
      type: DataTypes.STRING(100),
      field: 'supplier_batch_number'
    },
    qualityCheckStatus: {
      type: DataTypes.ENUM('PENDING', 'PASSED', 'FAILED', 'QUARANTINED'),
      defaultValue: 'PENDING',
      field: 'quality_check_status'
    },
    qualityCheckDate: {
      type: DataTypes.DATEONLY,
      field: 'quality_check_date'
    },
    qualityCheckBy: {
      type: DataTypes.UUID,
      field: 'quality_check_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
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
    tableName: 'inventory_batches',
    underscored: true,
    timestamps: true
  });

  InventoryBatch.associate = (models) => {
    InventoryBatch.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    InventoryBatch.belongsTo(models.LogisticItem, {
      foreignKey: 'itemId',
      as: 'item'
    });
    
    InventoryBatch.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    InventoryBatch.belongsTo(models.User, {
      foreignKey: 'qualityCheckBy',
      as: 'qualityChecker'
    });
    
    InventoryBatch.hasMany(models.InventoryMovement, {
      foreignKey: 'batchId',
      as: 'movements'
    });
  };

  return InventoryBatch;
};