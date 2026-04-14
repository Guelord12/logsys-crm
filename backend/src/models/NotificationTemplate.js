module.exports = (sequelize, DataTypes) => {
  const NotificationTemplate = sequelize.define('NotificationTemplate', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    templateCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'template_code'
    },
    templateName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'template_name'
    },
    typeId: {
      type: DataTypes.INTEGER,
      field: 'type_id',
      references: {
        model: 'notification_types',
        key: 'id'
      }
    },
    emailSubjectTemplate: {
      type: DataTypes.TEXT,
      field: 'email_subject_template'
    },
    emailBodyTemplate: {
      type: DataTypes.TEXT,
      field: 'email_body_template'
    },
    emailHtmlTemplate: {
      type: DataTypes.TEXT,
      field: 'email_html_template'
    },
    smsTemplate: {
      type: DataTypes.TEXT,
      field: 'sms_template'
    },
    pushTitleTemplate: {
      type: DataTypes.TEXT,
      field: 'push_title_template'
    },
    pushBodyTemplate: {
      type: DataTypes.TEXT,
      field: 'push_body_template'
    },
    inAppTitleTemplate: {
      type: DataTypes.TEXT,
      field: 'in_app_title_template'
    },
    inAppMessageTemplate: {
      type: DataTypes.TEXT,
      field: 'in_app_message_template'
    },
    variables: {
      type: DataTypes.JSONB
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'notification_templates',
    underscored: true,
    timestamps: true
  });

  NotificationTemplate.associate = (models) => {
    NotificationTemplate.belongsTo(models.NotificationType, {
      foreignKey: 'typeId',
      as: 'type'
    });
  };

  return NotificationTemplate;
};