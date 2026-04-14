// backend/src/models/UserSession.js

module.exports = (sequelize, DataTypes) => {
  const UserSession = sequelize.define('UserSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    sessionToken: {
      type: DataTypes.TEXT,  // Changé de STRING(255) à TEXT
      allowNull: false,
      field: 'session_token'
    },
    refreshToken: {
      type: DataTypes.TEXT,  // Changé de STRING(255) à TEXT
      field: 'refresh_token'
    },
    ipAddress: {
      type: DataTypes.INET,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,  // Changé de STRING à TEXT
      field: 'user_agent'
    },
    deviceInfo: {
      type: DataTypes.JSONB,
      field: 'device_info'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_activity_at'
    },
    loggedOutAt: {
      type: DataTypes.DATE,
      field: 'logged_out_at'
    }
  }, {
    tableName: 'user_sessions',
    underscored: true,
    timestamps: true,
    paranoid: false  // Désactiver le soft delete
  });

  UserSession.associate = (models) => {
    UserSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return UserSession;
};