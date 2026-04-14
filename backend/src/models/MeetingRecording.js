module.exports = (sequelize, DataTypes) => {
  const MeetingRecording = sequelize.define('MeetingRecording', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
    recordingUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'recording_url'
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      field: 'duration_seconds'
    },
    fileSizeBytes: {
      type: DataTypes.BIGINT,
      field: 'file_size_bytes'
    },
    format: {
      type: DataTypes.STRING(20),
      defaultValue: 'MP4'
    },
    quality: {
      type: DataTypes.STRING(20),
      defaultValue: 'HD'
    },
    hasTranscription: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_transcription'
    },
    transcriptionText: {
      type: DataTypes.TEXT,
      field: 'transcription_text'
    },
    transcriptionUrl: {
      type: DataTypes.TEXT,
      field: 'transcription_url'
    },
    processingStatus: {
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
      defaultValue: 'PENDING',
      field: 'processing_status'
    },
    processedAt: {
      type: DataTypes.DATE,
      field: 'processed_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at'
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'meeting_recordings',
    underscored: true,
    timestamps: true
  });

  MeetingRecording.associate = (models) => {
    MeetingRecording.belongsTo(models.Meeting, {
      foreignKey: 'meetingId',
      as: 'meeting'
    });
    
    MeetingRecording.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return MeetingRecording;
};