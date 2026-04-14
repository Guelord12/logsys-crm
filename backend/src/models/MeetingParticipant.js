module.exports = (sequelize, DataTypes) => {
  const MeetingParticipant = sequelize.define('MeetingParticipant', {
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
    externalEmail: {
      type: DataTypes.STRING(255),
      field: 'external_email'
    },
    externalName: {
      type: DataTypes.STRING(200),
      field: 'external_name'
    },
    role: {
      type: DataTypes.ENUM('ORGANIZER', 'PRESENTER', 'ATTENDEE', 'GUEST'),
      defaultValue: 'ATTENDEE'
    },
    responseStatus: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE'),
      defaultValue: 'PENDING',
      field: 'response_status'
    },
    respondedAt: {
      type: DataTypes.DATE,
      field: 'responded_at'
    },
    responseMessage: {
      type: DataTypes.TEXT,
      field: 'response_message'
    },
    joinedAt: {
      type: DataTypes.DATE,
      field: 'joined_at'
    },
    leftAt: {
      type: DataTypes.DATE,
      field: 'left_at'
    },
    actualDurationMinutes: {
      type: DataTypes.INTEGER,
      field: 'actual_duration_minutes'
    },
    connectionQuality: {
      type: DataTypes.ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR'),
      field: 'connection_quality'
    },
    reminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'reminder_sent'
    },
    reminderSentAt: {
      type: DataTypes.DATE,
      field: 'reminder_sent_at'
    }
  }, {
    tableName: 'meeting_participants',
    underscored: true,
    timestamps: true
  });

  MeetingParticipant.associate = (models) => {
    MeetingParticipant.belongsTo(models.Meeting, {
      foreignKey: 'meetingId',
      as: 'meeting'
    });
    
    MeetingParticipant.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return MeetingParticipant;
};