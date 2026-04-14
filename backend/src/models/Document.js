module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,  // ✅ Nullable pour l'admin système
      field: 'company_id',
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    documentCode: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'document_code'
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    documentType: {
      type: DataTypes.STRING(50),
      field: 'document_type'
    },
    category: {
      type: DataTypes.STRING(100)
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
    versionNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'version_number'
    },
    previousVersionId: {
      type: DataTypes.UUID,
      field: 'previous_version_id',
      references: {
        model: 'documents',
        key: 'id'
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB
    },
    relatedEntityType: {
      type: DataTypes.STRING(50),
      field: 'related_entity_type'
    },
    relatedEntityId: {
      type: DataTypes.UUID,
      field: 'related_entity_id'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_public'
    },
    accessLevel: {
      type: DataTypes.ENUM('PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL'),
      defaultValue: 'INTERNAL',
      field: 'access_level'
    },
    ocrText: {
      type: DataTypes.TEXT,
      field: 'ocr_text'
    },
    indexedContent: {
      type: DataTypes.TSVECTOR,
      field: 'indexed_content'
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
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'view_count'
    }
  }, {
    tableName: 'documents',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  });

  Document.associate = (models) => {
    Document.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    Document.belongsTo(models.User, {
      foreignKey: 'uploadedBy',
      as: 'uploader'
    });
    
    Document.belongsTo(models.Document, {
      foreignKey: 'previousVersionId',
      as: 'previousVersion'
    });
    
    Document.hasMany(models.Document, {
      foreignKey: 'previousVersionId',
      as: 'newerVersions'
    });
  };

  return Document;
};