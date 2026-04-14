module.exports = (sequelize, DataTypes) => {
  const UserPermission = sequelize.define('UserPermission', {
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
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'permission_id',
      references: {
        model: 'permissions',
        key: 'id'
      }
    },
    grantType: {
      type: DataTypes.ENUM('GRANT', 'DENY'),
      defaultValue: 'GRANT',
      field: 'grant_type'
    },
    grantedBy: {
      type: DataTypes.UUID,
      field: 'granted_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    grantedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'granted_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    reason: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'user_permissions',
    underscored: true,
    timestamps: false
  });

  UserPermission.associate = (models) => {
    UserPermission.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    UserPermission.belongsTo(models.Permission, {
      foreignKey: 'permissionId',
      as: 'permission'
    });
    
    UserPermission.belongsTo(models.User, {
      foreignKey: 'grantedBy',
      as: 'granter'
    });
  };

  return UserPermission;
};