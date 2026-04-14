module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    notificationCode: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'notification_code'
    },
    typeId: {
      type: DataTypes.INTEGER,
      field: 'type_id',
      references: {
        model: 'notification_types',
        key: 'id'
      }
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
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    richContent: {
      type: DataTypes.JSONB,
      field: 'rich_content'
    },
    actionUrl: {
      type: DataTypes.TEXT,
      field: 'action_url'
    },
    actionText: {
      type: DataTypes.STRING(100),
      field: 'action_text'
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
      defaultValue: 'NORMAL'
    },
    status: {
      type: DataTypes.ENUM('UNREAD', 'READ', 'ARCHIVED', 'DELETED'),
      defaultValue: 'UNREAD'
    },
    scheduledFor: {
      type: DataTypes.DATE,
      field: 'scheduled_for'
    },
    sentAt: {
      type: DataTypes.DATE,
      field: 'sent_at'
    },
    readAt: {
      type: DataTypes.DATE,
      field: 'read_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at'
    },
    channelsUsed: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      field: 'channels_used'
    },
    sourceType: {
      type: DataTypes.STRING(50),
      field: 'source_type'
    },
    sourceId: {
      type: DataTypes.UUID,
      field: 'source_id'
    }
  }, {
    tableName: 'notifications',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (notification) => {
        if (!notification.notificationCode) {
          notification.notificationCode = `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        }
      }
    }
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.NotificationType, {
      foreignKey: 'typeId',
      as: 'type'
    });
    
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    Notification.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
  };

  return Notification;
};