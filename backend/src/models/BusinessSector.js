module.exports = (sequelize, DataTypes) => {
  const BusinessSector = sequelize.define('BusinessSector', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    parentId: {
      type: DataTypes.INTEGER,
      field: 'parent_id'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'business_sectors',
    underscored: true,
    timestamps: true
  });

  BusinessSector.associate = (models) => {
    BusinessSector.belongsTo(models.BusinessSector, {
      foreignKey: 'parentId',
      as: 'parent'
    });
    BusinessSector.hasMany(models.BusinessSector, {
      foreignKey: 'parentId',
      as: 'children'
    });
  };

  return BusinessSector;
};