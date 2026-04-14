module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id',
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    taskCode: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'task_code'
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    taskTypeId: {
      type: DataTypes.INTEGER,
      field: 'task_type_id',
      references: {
        model: 'task_types',
        key: 'id'
      }
    },
    assignedTo: {
      type: DataTypes.UUID,
      field: 'assigned_to',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedBy: {
      type: DataTypes.UUID,
      field: 'assigned_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    departmentId: {
      type: DataTypes.INTEGER,
      field: 'department_id'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      field: 'start_date'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      field: 'due_date'
    },
    estimatedHours: {
      type: DataTypes.INTEGER,
      field: 'estimated_hours'
    },
    actualHours: {
      type: DataTypes.INTEGER,
      field: 'actual_hours'
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      defaultValue: 'MEDIUM'
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'),
      defaultValue: 'PENDING'
    },
    completionPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'completion_percentage'
    },
    parentTaskId: {
      type: DataTypes.UUID,
      field: 'parent_task_id',
      references: {
        model: 'tasks',
        key: 'id'
      }
    },
    relatedEntityType: {
      type: DataTypes.STRING(50),
      field: 'related_entity_type'
    },
    relatedEntityId: {
      type: DataTypes.UUID,
      field: 'related_entity_id'
    },
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'requires_approval'
    },
    approvedBy: {
      type: DataTypes.UUID,
      field: 'approved_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      field: 'approved_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at'
    },
    completedBy: {
      type: DataTypes.UUID,
      field: 'completed_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    attachments: {
      type: DataTypes.JSONB
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
    tableName: 'tasks',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (task) => {
        if (!task.taskCode) {
          task.taskCode = `TSK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        }
      }
    }
  });

  Task.associate = (models) => {
    Task.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    Task.belongsTo(models.TaskType, {
      foreignKey: 'taskTypeId',
      as: 'taskType'
    });
    
    Task.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignedToUser'
    });
    
    Task.belongsTo(models.User, {
      foreignKey: 'assignedBy',
      as: 'assignedByUser'
    });
    
    Task.belongsTo(models.Task, {
      foreignKey: 'parentTaskId',
      as: 'parentTask'
    });
    
    Task.hasMany(models.Task, {
      foreignKey: 'parentTaskId',
      as: 'subtasks'
    });
    
    Task.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    Task.hasMany(models.TaskComment, {
      foreignKey: 'taskId',
      as: 'comments'
    });
  };

  return Task;
};