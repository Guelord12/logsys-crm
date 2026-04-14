module.exports = (sequelize, DataTypes) => {
  const JobPosition = sequelize.define('JobPosition', {
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    hierarchyLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'hierarchy_level'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'job_positions',
    underscored: true,
    timestamps: true
  });

  return JobPosition;
};