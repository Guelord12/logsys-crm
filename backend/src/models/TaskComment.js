module.exports = (sequelize, DataTypes) => {
  const TaskComment = sequelize.define('TaskComment', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'task_id',
      references: {
        model: 'tasks',
        key: 'id'
      }
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
    commentText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'comment_text'
    },
    mentions: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: []
    }
  }, {
    tableName: 'task_comments',
    underscored: true,
    timestamps: true
  });

  TaskComment.associate = (models) => {
    TaskComment.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'task'
    });
    
    TaskComment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return TaskComment;
};