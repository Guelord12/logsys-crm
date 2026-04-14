module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      field: 'company_id',
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    roleCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'role_code'
    },
    roleName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'role_name'
    },
    description: {
      type: DataTypes.TEXT
    },
    isSystemRole: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_system_role'
    },
    hierarchyLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'hierarchy_level'
    }
  }, {
    tableName: 'roles',
    underscored: true,
    timestamps: true
  });

  Role.associate = (models) => {
    Role.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    Role.belongsToMany(models.Permission, {
      through: 'role_permissions',
      foreignKey: 'roleId',
      otherKey: 'permissionId',
      as: 'permissions'
    });

    // CORRECTION : Ajouter l'association belongsToMany avec User
    Role.belongsToMany(models.User, {
      through: models.UserRole,
      foreignKey: 'roleId',
      otherKey: 'userId',
      as: 'users'
    });
    
    Role.hasMany(models.UserRole, {
      foreignKey: 'roleId',
      as: 'userRoles'
    });
  };

  return Role;
};