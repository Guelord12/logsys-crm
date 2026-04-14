module.exports = (sequelize, DataTypes) => {
  const TaskType = sequelize.define('TaskType', {
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
    estimatedDurationHours: {
      type: DataTypes.INTEGER,
      field: 'estimated_duration_hours'
    },
    priorityDefault: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      defaultValue: 'MEDIUM',
      field: 'priority_default'
    },
    moduleId: {
      type: DataTypes.INTEGER,
      field: 'module_id',
      references: {
        model: 'system_modules',
        key: 'id'
      }
    }
  }, {
    tableName: 'task_types',
    underscored: true,
    timestamps: true
  });

  TaskType.associate = (models) => {
    TaskType.belongsTo(models.SystemModule, {
      foreignKey: 'moduleId',
      as: 'module'
    });
    
    TaskType.hasMany(models.Task, {
      foreignKey: 'taskTypeId',
      as: 'tasks'
    });
  };

  return TaskType;
};