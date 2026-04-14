module.exports = (sequelize, DataTypes) => {
  const InventoryMovement = sequelize.define('InventoryMovement', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
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
    movementCode: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'movement_code'
    },
    movementType: {
      type: DataTypes.ENUM('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'PRODUCTION'),
      allowNull: false,
      field: 'movement_type'
    },
    fromWarehouseId: {
      type: DataTypes.UUID,
      field: 'from_warehouse_id',
      references: {
        model: 'warehouses',
        key: 'id'
      }
    },
    toWarehouseId: {
      type: DataTypes.UUID,
      field: 'to_warehouse_id',
      references: {
        model: 'warehouses',
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
    batchId: {
      type: DataTypes.UUID,
      field: 'batch_id',
      references: {
        model: 'inventory_batches',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'unit_cost'
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'total_cost'
    },
    referenceType: {
      type: DataTypes.STRING(50),
      field: 'reference_type'
    },
    referenceId: {
      type: DataTypes.UUID,
      field: 'reference_id'
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      field: 'reference_number'
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'PENDING'
    },
    movementDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'movement_date'
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at'
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
    },
    completedBy: {
      type: DataTypes.UUID,
      field: 'completed_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'inventory_movements',
    underscored: true,
    timestamps: true,        // ✅ Active les timestamps
    createdAt: 'created_at', // ✅ Utilise la colonne existante
    updatedAt: false,        // ✅ Désactive updated_at (n'existe pas)
    paranoid: false          // ✅ Désactive deleted_at (n'existe pas)
  });

  InventoryMovement.associate = (models) => {
    InventoryMovement.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    InventoryMovement.belongsTo(models.Warehouse, {
      foreignKey: 'fromWarehouseId',
      as: 'fromWarehouse'
    });
    
    InventoryMovement.belongsTo(models.Warehouse, {
      foreignKey: 'toWarehouseId',
      as: 'toWarehouse'
    });
    
    InventoryMovement.belongsTo(models.LogisticItem, {
      foreignKey: 'itemId',
      as: 'item'
    });
    
    InventoryMovement.belongsTo(models.InventoryBatch, {
      foreignKey: 'batchId',
      as: 'batch'
    });
    
    InventoryMovement.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    InventoryMovement.belongsTo(models.User, {
      foreignKey: 'completedBy',
      as: 'completer'
    });
  };

  return InventoryMovement;
};