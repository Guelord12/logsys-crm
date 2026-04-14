module.exports = (sequelize, DataTypes) => {
  const UserType = sequelize.define('UserType', {
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
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'user_types',
    underscored: true,
    timestamps: true
  });

  UserType.associate = (models) => {
    UserType.hasMany(models.User, {
      foreignKey: 'userTypeId',
      as: 'users'
    });
  };

  return UserType;
};