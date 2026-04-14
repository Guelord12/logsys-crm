module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    threadId: {
      type: DataTypes.UUID,
      field: 'thread_id'
    },
    subject: {
      type: DataTypes.STRING(500)
    },
    senderId: {
      type: DataTypes.UUID,
      field: 'sender_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    senderEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'sender_email'
    },
    senderName: {
      type: DataTypes.STRING(200),
      field: 'sender_name'
    },
    bodyText: {
      type: DataTypes.TEXT,
      field: 'body_text'
    },
    bodyHtml: {
      type: DataTypes.TEXT,
      field: 'body_html'
    },
    snippet: {
      type: DataTypes.TEXT
    },
    importance: {
      type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH'),
      defaultValue: 'NORMAL'
    },
    sensitivity: {
      type: DataTypes.ENUM('NORMAL', 'PERSONAL', 'PRIVATE', 'CONFIDENTIAL'),
      defaultValue: 'NORMAL'
    },
    hasAttachments: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_attachments'
    },
    sizeBytes: {
      type: DataTypes.INTEGER,
      field: 'size_bytes'
    },
    sentAt: {
      type: DataTypes.DATE,
      field: 'sent_at'
    },
    receivedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'received_at'
    },
    readAt: {
      type: DataTypes.DATE,
      field: 'read_at'
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'SENT', 'DELIVERED', 'FAILED', 'SCHEDULED'),
      defaultValue: 'SENT'
    },
    scheduledFor: {
      type: DataTypes.DATE,
      field: 'scheduled_for'
    }
  }, {
    tableName: 'messages',
    underscored: true,
    timestamps: true
  });

  Message.associate = (models) => {
    Message.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
    
    Message.hasMany(models.Attachment, {
      foreignKey: 'messageId',
      as: 'attachments'
    });
    
    Message.hasMany(models.MessageRecipient, {
      foreignKey: 'messageId',
      as: 'recipients'
    });
  };

  return Message;
};