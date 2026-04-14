module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define('Inventory', {
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
    warehouseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'warehouse_id',
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
    quantityOnHand: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'quantity_on_hand'
    },
    quantityReserved: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'quantity_reserved'
    },
    quantityAvailable: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'quantity_available'
    },
    quantityInTransit: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'quantity_in_transit'
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'unit_cost'
    },
    locationCode: {
      type: DataTypes.STRING(100),
      field: 'location_code'
    },
    zone: {
      type: DataTypes.STRING(50)
    },
    aisle: {
      type: DataTypes.STRING(20)
    },
    rack: {
      type: DataTypes.STRING(20)
    },
    shelf: {
      type: DataTypes.STRING(20)
    },
    bin: {
      type: DataTypes.STRING(20)
    },
    lastCountedAt: {
      type: DataTypes.DATE,
      field: 'last_counted_at'
    },
    lastMovementAt: {
      type: DataTypes.DATE,
      field: 'last_movement_at'
    }
  }, {
    tableName: 'inventory',
    underscored: true,
    timestamps: true,    // ✅ created_at et updated_at existent
    paranoid: false      // ✅ deleted_at n'existe pas
  });

  Inventory.associate = (models) => {
    Inventory.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    Inventory.belongsTo(models.Warehouse, {
      foreignKey: 'warehouseId',
      as: 'warehouse'
    });
    
    Inventory.belongsTo(models.LogisticItem, {
      foreignKey: 'itemId',
      as: 'item'
    });
  };

  return Inventory;
};