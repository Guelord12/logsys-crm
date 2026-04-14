module.exports = (sequelize, DataTypes) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    settingKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'setting_key'
    },
    settingValue: {
      type: DataTypes.TEXT,
      field: 'setting_value'
    },
    settingType: {
      type: DataTypes.ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY'),
      defaultValue: 'STRING',
      field: 'setting_type'
    },
    description: {
      type: DataTypes.TEXT
    },
    isEncrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_encrypted'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_public'
    },
    updatedBy: {
      type: DataTypes.UUID,
      field: 'updated_by'
    }
  }, {
    tableName: 'system_settings',
    underscored: true,
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: false
  });

  SystemSetting.associate = (models) => {
    if (models.User) {
      SystemSetting.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater'
      });
    }
  };

  return SystemSetting;
};