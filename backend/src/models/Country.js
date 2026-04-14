module.exports = (sequelize, DataTypes) => {
  const Country = sequelize.define('Country', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phoneCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'phone_code'
    },
    currencyCode: {
      type: DataTypes.STRING(3),
      field: 'currency_code'
    },
    currencyName: {
      type: DataTypes.STRING(50),
      field: 'currency_name'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'countries',
    underscored: true,
    timestamps: true
  });

  Country.associate = (models) => {
    Country.hasMany(models.Company, {
      foreignKey: 'countryId',
      as: 'companies'
    });
    
    Country.hasMany(models.Warehouse, {
      foreignKey: 'countryId',
      as: 'warehouses'
    });
    
    Country.hasMany(models.AuxiliaryAccount, {
      foreignKey: 'countryId',
      as: 'auxiliaryAccounts'
    });
  };

  return Country;
};