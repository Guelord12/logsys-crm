module.exports = (sequelize, DataTypes) => {
  const Meeting = sequelize.define('Meeting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    meetingCode: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'meeting_code'
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    organizerId: {
      type: DataTypes.UUID,
      field: 'organizer_id',
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
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time'
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'UTC'
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      field: 'duration_minutes'
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_recurring'
    },
    recurrencePattern: {
      type: DataTypes.JSONB,
      field: 'recurrence_pattern'
    },
    recurrenceEndDate: {
      type: DataTypes.DATEONLY,
      field: 'recurrence_end_date'
    },
    parentMeetingId: {
      type: DataTypes.UUID,
      field: 'parent_meeting_id',
      references: {
        model: 'meetings',
        key: 'id'
      }
    },
    meetingType: {
      type: DataTypes.ENUM('VIDEO', 'AUDIO', 'WEBINAR', 'IN_PERSON'),
      defaultValue: 'VIDEO',
      field: 'meeting_type'
    },
    meetingPlatform: {
      type: DataTypes.STRING(50),
      defaultValue: 'LOGSYS_MEET',
      field: 'meeting_platform'
    },
    meetingUrl: {
      type: DataTypes.TEXT,
      field: 'meeting_url'
    },
    meetingIdExternal: {
      type: DataTypes.STRING(255),
      field: 'meeting_id_external'
    },
    meetingPassword: {
      type: DataTypes.STRING(100),
      field: 'meeting_password'
    },
    enableWaitingRoom: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'enable_waiting_room'
    },
    allowChat: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'allow_chat'
    },
    allowRecording: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'allow_recording'
    },
    muteParticipantsOnEntry: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'mute_participants_on_entry'
    },
    requireAuthentication: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'require_authentication'
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      field: 'max_participants'
    },
    status: {
      type: DataTypes.ENUM('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED'),
      defaultValue: 'SCHEDULED'
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cancelledAt: {
      type: DataTypes.DATE,
      field: 'cancelled_at'
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      field: 'cancellation_reason'
    }
  }, {
    tableName: 'meetings',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (meeting) => {
        if (!meeting.meetingCode) {
          meeting.meetingCode = `MEET${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        }
        if (meeting.startTime && meeting.endTime) {
          meeting.durationMinutes = Math.floor((meeting.endTime - meeting.startTime) / 60000);
        }
      }
    }
  });

  Meeting.associate = (models) => {
    Meeting.belongsTo(models.User, {
      foreignKey: 'organizerId',
      as: 'organizer'
    });
    
    Meeting.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    Meeting.belongsTo(models.Meeting, {
      foreignKey: 'parentMeetingId',
      as: 'parent'
    });
    
    Meeting.hasMany(models.Meeting, {
      foreignKey: 'parentMeetingId',
      as: 'occurrences'
    });
    
    Meeting.hasMany(models.MeetingParticipant, {
      foreignKey: 'meetingId',
      as: 'participants'
    });
    
    Meeting.hasMany(models.MeetingRecording, {
      foreignKey: 'meetingId',
      as: 'recordings'
    });
    
    Meeting.hasMany(models.MeetingChat, {
      foreignKey: 'meetingId',
      as: 'chatMessages'
    });
    
    Meeting.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return Meeting;
};