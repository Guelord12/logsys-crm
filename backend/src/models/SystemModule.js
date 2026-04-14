module.exports = (sequelize, DataTypes) => {
  const SystemModule = sequelize.define('SystemModule', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    icon: {
      type: DataTypes.STRING(50)
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'system_modules',
    underscored: true,
    timestamps: true
  });

  SystemModule.associate = (models) => {
    if (models.Permission) {
      SystemModule.hasMany(models.Permission, {
        foreignKey: 'moduleId',
        as: 'permissions'
      });
    }
  };

  return SystemModule;
};