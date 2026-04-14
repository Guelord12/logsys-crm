module.exports = (sequelize, DataTypes) => {
  const NotificationType = sequelize.define('NotificationType', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    category: {
      type: DataTypes.STRING(50)
    },
    defaultPriority: {
      type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
      defaultValue: 'NORMAL',
      field: 'default_priority'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'notification_types',
    underscored: true,
    timestamps: true
  });

  NotificationType.associate = (models) => {
    NotificationType.hasMany(models.Notification, {
      foreignKey: 'typeId',
      as: 'notifications'
    });
    
    NotificationType.hasMany(models.NotificationTemplate, {
      foreignKey: 'typeId',
      as: 'templates'
    });
  };

  return NotificationType;
};