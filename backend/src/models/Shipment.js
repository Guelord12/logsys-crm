module.exports = (sequelize, DataTypes) => {
  const Shipment = sequelize.define('Shipment', {
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
    shipmentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'shipment_number'
    },
    shipmentType: {
      type: DataTypes.ENUM('INBOUND', 'OUTBOUND', 'TRANSFER'),
      field: 'shipment_type'
    },
    carrierId: {
      type: DataTypes.UUID,
      field: 'carrier_id'
    },
    carrierName: {
      type: DataTypes.STRING(200),
      field: 'carrier_name'
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      field: 'tracking_number'
    },
    transportMode: {
      type: DataTypes.ENUM('ROAD', 'RAIL', 'AIR', 'SEA', 'MULTIMODAL'),
      field: 'transport_mode'
    },
    scheduledDeparture: {
      type: DataTypes.DATE,
      field: 'scheduled_departure'
    },
    actualDeparture: {
      type: DataTypes.DATE,
      field: 'actual_departure'
    },
    scheduledArrival: {
      type: DataTypes.DATE,
      field: 'scheduled_arrival'
    },
    actualArrival: {
      type: DataTypes.DATE,
      field: 'actual_arrival'
    },
    originWarehouseId: {
      type: DataTypes.UUID,
      field: 'origin_warehouse_id',
      references: {
        model: 'warehouses',
        key: 'id'
      }
    },
    destinationWarehouseId: {
      type: DataTypes.UUID,
      field: 'destination_warehouse_id',
      references: {
        model: 'warehouses',
        key: 'id'
      }
    },
    originAddress: {
      type: DataTypes.TEXT,
      field: 'origin_address'
    },
    destinationAddress: {
      type: DataTypes.TEXT,
      field: 'destination_address'
    },
    status: {
      type: DataTypes.ENUM('PLANNED', 'IN_TRANSIT', 'DELAYED', 'DELIVERED', 'CANCELLED'),
      defaultValue: 'PLANNED'
    },
    documents: {
      type: DataTypes.JSONB
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
    tableName: 'shipments',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: false
  });

  Shipment.associate = (models) => {
    Shipment.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    Shipment.belongsTo(models.Warehouse, {
      foreignKey: 'originWarehouseId',
      as: 'originWarehouse'
    });
    
    Shipment.belongsTo(models.Warehouse, {
      foreignKey: 'destinationWarehouseId',
      as: 'destinationWarehouse'
    });
    
    Shipment.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return Shipment;
};