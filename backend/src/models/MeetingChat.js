module.exports = (sequelize, DataTypes) => {
  const MeetingChat = sequelize.define('MeetingChat', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    meetingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'meeting_id',
      references: {
        model: 'meetings',
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    messageType: {
      type: DataTypes.ENUM('TEXT', 'FILE', 'SYSTEM', 'EMOJI'),
      defaultValue: 'TEXT',
      field: 'message_type'
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_private'
    },
    recipientId: {
      type: DataTypes.UUID,
      field: 'recipient_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sentAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'sent_at'
    },
    editedAt: {
      type: DataTypes.DATE,
      field: 'edited_at'
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at'
    }
  }, {
    tableName: 'meeting_chats',
    underscored: true,
    timestamps: false
  });

  MeetingChat.associate = (models) => {
    MeetingChat.belongsTo(models.Meeting, {
      foreignKey: 'meetingId',
      as: 'meeting'
    });
    
    MeetingChat.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'sender'
    });
    
    MeetingChat.belongsTo(models.User, {
      foreignKey: 'recipientId',
      as: 'recipient'
    });
  };

  return MeetingChat;
};