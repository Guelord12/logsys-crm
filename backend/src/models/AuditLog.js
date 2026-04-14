module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    logTimestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'log_timestamp'
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    companyId: {
      type: DataTypes.UUID,
      field: 'company_id',
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    userEmail: {
      type: DataTypes.STRING(255),
      field: 'user_email'
    },
    ipAddress: {
      type: DataTypes.INET,
      field: 'ip_address'
    },
    sessionId: {
      type: DataTypes.UUID,
      field: 'session_id'
    },
    actionType: {
      type: DataTypes.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'EXECUTE'),
      field: 'action_type'
    },
    entityType: {
      type: DataTypes.STRING(100),
      field: 'entity_type'
    },
    entityId: {
      type: DataTypes.UUID,
      field: 'entity_id'
    },
    entityName: {
      type: DataTypes.STRING(200),
      field: 'entity_name'
    },
    actionDescription: {
      type: DataTypes.TEXT,
      field: 'action_description'
    },
    changes: {
      type: DataTypes.JSONB
    },
    oldValues: {
      type: DataTypes.JSONB,
      field: 'old_values'
    },
    newValues: {
      type: DataTypes.JSONB,
      field: 'new_values'
    },
    requestMethod: {
      type: DataTypes.STRING(10),
      field: 'request_method'
    },
    requestUrl: {
      type: DataTypes.TEXT,
      field: 'request_url'
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED', 'PARTIAL', 'DENIED')
    },
    errorMessage: {
      type: DataTypes.TEXT,
      field: 'error_message'
    },
    executionTimeMs: {
      type: DataTypes.INTEGER,
      field: 'execution_time_ms'
    }
  }, {
    tableName: 'audit_logs',
    underscored: true,
    timestamps: false
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    AuditLog.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
  };

  return AuditLog;
};