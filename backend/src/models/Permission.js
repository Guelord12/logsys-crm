module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    moduleId: {
      type: DataTypes.INTEGER,
      field: 'module_id',
      references: {
        model: 'system_modules',
        key: 'id'
      }
    },
    code: {
      type: DataTypes.STRING(100),
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
    permissionLevel: {
      type: DataTypes.ENUM('VIEW', 'CREATE', 'EDIT', 'DELETE', 'ADMIN'),
      field: 'permission_level'
    }
  }, {
    tableName: 'permissions',
    underscored: true,
    timestamps: true
  });

  Permission.associate = (models) => {
    Permission.belongsTo(models.SystemModule, {
      foreignKey: 'moduleId',
      as: 'module'
    });
    
    Permission.belongsToMany(models.Role, {
      through: 'role_permissions',
      foreignKey: 'permissionId',
      as: 'roles'
    });
    
    Permission.hasMany(models.UserPermission, {
      foreignKey: 'permissionId',
      as: 'userPermissions'
    });
  };

  return Permission;
};