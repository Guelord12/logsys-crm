module.exports = (sequelize, DataTypes) => {
  const MessageRecipient = sequelize.define('MessageRecipient', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'message_id',
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    recipientId: {
      type: DataTypes.UUID,
      field: 'recipient_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    recipientEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'recipient_email'
    },
    recipientName: {
      type: DataTypes.STRING(200),
      field: 'recipient_name'
    },
    recipientType: {
      type: DataTypes.ENUM('TO', 'CC', 'BCC', 'FROM'),
      defaultValue: 'TO',
      field: 'recipient_type'
    },
    folderId: {
      type: DataTypes.INTEGER,
      field: 'folder_id',
      references: {
        model: 'email_folders',
        key: 'id'
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },
    isStarred: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_starred'
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_archived'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted'
    },
    readAt: {
      type: DataTypes.DATE,
      field: 'read_at'
    },
    repliedAt: {
      type: DataTypes.DATE,
      field: 'replied_at'
    },
    forwardedAt: {
      type: DataTypes.DATE,
      field: 'forwarded_at'
    },
    labels: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    }
  }, {
    tableName: 'message_recipients',
    underscored: true,
    timestamps: true
  });

  MessageRecipient.associate = (models) => {
    MessageRecipient.belongsTo(models.Message, {
      foreignKey: 'messageId',
      as: 'message'
    });
    
    MessageRecipient.belongsTo(models.User, {
      foreignKey: 'recipientId',
      as: 'recipient'
    });
    
    MessageRecipient.belongsTo(models.EmailFolder, {
      foreignKey: 'folderId',
      as: 'folder'
    });
  };

  return MessageRecipient;
};