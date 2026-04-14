module.exports = (sequelize, DataTypes) => {
  const CompanySetting = sequelize.define('CompanySetting', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id'
    },
    settingKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'setting_key'
    },
    settingValue: {
      type: DataTypes.TEXT,
      field: 'setting_value'
    },
    settingType: {
      type: DataTypes.STRING(20),
      defaultValue: 'STRING',
      field: 'setting_type'
    },
    updatedBy: {
      type: DataTypes.UUID,
      field: 'updated_by'
    }
  }, {
    tableName: 'company_settings',
    underscored: true,
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: false
  });

  CompanySetting.associate = (models) => {
    if (models.Company) {
      CompanySetting.belongsTo(models.Company, {
        foreignKey: 'companyId',
        as: 'company'
      });
    }
    if (models.User) {
      CompanySetting.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater'
      });
    }
  };

  return CompanySetting;
};