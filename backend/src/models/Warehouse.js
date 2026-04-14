module.exports = (sequelize, DataTypes) => {
  const Warehouse = sequelize.define('Warehouse', {
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
    warehouseCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'warehouse_code'
    },
    warehouseName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'warehouse_name'
    },
    warehouseType: {
      type: DataTypes.ENUM('MAIN', 'DISTRIBUTION', 'TEMPORARY', 'TRANSIT'),
      field: 'warehouse_type'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(100)
    },
    postalCode: {
      type: DataTypes.STRING(20),
      field: 'postal_code'
    },
    countryId: {
      type: DataTypes.INTEGER,
      field: 'country_id',
      references: {
        model: 'countries',
        key: 'id'
      }
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8)
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8)
    },
    capacityCubicMeters: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'capacity_cubic_meters'
    },
    capacityPallets: {
      type: DataTypes.INTEGER,
      field: 'capacity_pallets'
    },
    capacityUnits: {
      type: DataTypes.INTEGER,
      field: 'capacity_units'
    },
    contactPerson: {
      type: DataTypes.STRING(200),
      field: 'contact_person'
    },
    contactPhone: {
      type: DataTypes.STRING(50),
      field: 'contact_phone'
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      field: 'contact_email'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    operatingHours: {
      type: DataTypes.JSONB,
      field: 'operating_hours'
    }
  }, {
    tableName: 'warehouses',
    underscored: true,
    timestamps: true
  });

  Warehouse.associate = (models) => {
    Warehouse.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    Warehouse.belongsTo(models.Country, {
      foreignKey: 'countryId',
      as: 'country'
    });
    
    Warehouse.hasMany(models.Inventory, {
      foreignKey: 'warehouseId',
      as: 'inventory'
    });
    
    Warehouse.hasMany(models.InventoryMovement, {
      foreignKey: 'fromWarehouseId',
      as: 'outgoingMovements'
    });
    
    Warehouse.hasMany(models.InventoryMovement, {
      foreignKey: 'toWarehouseId',
      as: 'incomingMovements'
    });
    
    Warehouse.hasMany(models.PurchaseOrder, {
      foreignKey: 'warehouseId',
      as: 'purchaseOrders'
    });
  };

  return Warehouse;
};