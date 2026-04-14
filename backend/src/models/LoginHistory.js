module.exports = (sequelize, DataTypes) => {
  const LoginHistory = sequelize.define('LoginHistory', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id'
    },
    email: {
      type: DataTypes.STRING(255)
    },
    loginTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'login_time'
    },
    ipAddress: {
      type: DataTypes.INET,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    },
    loginStatus: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED', 'LOCKED', 'PASSWORD_EXPIRED'),
      field: 'login_status'
    },
    failureReason: {
      type: DataTypes.TEXT,
      field: 'failure_reason'
    },
    locationInfo: {
      type: DataTypes.JSONB,
      field: 'location_info'
    }
  }, {
    tableName: 'login_history',
    underscored: true,
    timestamps: false
  });

  LoginHistory.associate = (models) => {
    if (models.User) {
      LoginHistory.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  };

  return LoginHistory;
};