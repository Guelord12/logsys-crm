module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define('Attachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    messageId: {
      type: DataTypes.UUID,
      field: 'message_id',
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    filename: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    originalFilename: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'original_filename'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'file_size'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type'
    },
    fileExtension: {
      type: DataTypes.STRING(20),
      field: 'file_extension'
    },
    storagePath: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'storage_path'
    },
    storageProvider: {
      type: DataTypes.STRING(50),
      defaultValue: 'LOCAL',
      field: 'storage_provider'
    },
    checksum: {
      type: DataTypes.STRING(255)
    },
    encryptionKey: {
      type: DataTypes.TEXT,
      field: 'encryption_key'
    },
    isInline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_inline'
    },
    contentId: {
      type: DataTypes.STRING(255),
      field: 'content_id'
    },
    description: {
      type: DataTypes.TEXT
    },
    virusScanStatus: {
      type: DataTypes.ENUM('PENDING', 'CLEAN', 'INFECTED', 'ERROR'),
      defaultValue: 'PENDING',
      field: 'virus_scan_status'
    },
    scannedAt: {
      type: DataTypes.DATE,
      field: 'scanned_at'
    },
    uploadedBy: {
      type: DataTypes.UUID,
      field: 'uploaded_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'download_count'
    }
  }, {
    tableName: 'attachments',
    underscored: true,
    timestamps: true
  });

  Attachment.associate = (models) => {
    Attachment.belongsTo(models.Message, {
      foreignKey: 'messageId',
      as: 'message'
    });
    
    Attachment.belongsTo(models.User, {
      foreignKey: 'uploadedBy',
      as: 'uploader'
    });
  };

  return Attachment;
};