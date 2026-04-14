module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define('UserRole', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    assignedBy: {
      type: DataTypes.UUID,
      field: 'assigned_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'assigned_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'user_roles',
    underscored: true,
    timestamps: false
  });

  UserRole.associate = (models) => {
    UserRole.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    UserRole.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role'
    });
    
    UserRole.belongsTo(models.User, {
      foreignKey: 'assignedBy',
      as: 'assigner'
    });
  };

  return UserRole;
};