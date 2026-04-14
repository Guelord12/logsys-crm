module.exports = (sequelize, DataTypes) => {
  const EmailFolder = sequelize.define('EmailFolder', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    folderName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'folder_name'
    },
    folderType: {
      type: DataTypes.ENUM('INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM', 'ARCHIVE', 'CUSTOM'),
      allowNull: false,
      field: 'folder_type'
    },
    parentFolderId: {
      type: DataTypes.INTEGER,
      field: 'parent_folder_id',
      references: {
        model: 'email_folders',
        key: 'id'
      }
    },
    color: {
      type: DataTypes.STRING(20)
    },
    icon: {
      type: DataTypes.STRING(50)
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_system'
    }
  }, {
    tableName: 'email_folders',
    underscored: true,
    timestamps: true
  });

  EmailFolder.associate = (models) => {
    EmailFolder.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    EmailFolder.belongsTo(models.EmailFolder, {
      foreignKey: 'parentFolderId',
      as: 'parent'
    });
    
    EmailFolder.hasMany(models.EmailFolder, {
      foreignKey: 'parentFolderId',
      as: 'children'
    });
    
    EmailFolder.hasMany(models.MessageRecipient, {
      foreignKey: 'folderId',
      as: 'messages'
    });
  };

  return EmailFolder;
};