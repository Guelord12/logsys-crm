module.exports = (sequelize, DataTypes) => {
  const LogisticCategory = sequelize.define('LogisticCategory', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
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
    categoryCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'category_code'
    },
    categoryName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'category_name'
    },
    description: {
      type: DataTypes.TEXT
    },
    parentCategoryId: {
      type: DataTypes.INTEGER,
      field: 'parent_category_id',
      references: {
        model: 'logistic_categories',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'logistic_categories',
    underscored: true,
    timestamps: true,           // ✅ Garder timestamps activé
    createdAt: 'created_at',    // ✅ Utiliser la colonne existante
    updatedAt: false,           // ✅ Désactiver updated_at (n'existe pas dans la table)
    paranoid: false             // ✅ Désactiver deleted_at (n'existe pas)
  });

  LogisticCategory.associate = (models) => {
    LogisticCategory.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
    
    LogisticCategory.belongsTo(models.LogisticCategory, {
      foreignKey: 'parentCategoryId',
      as: 'parent'
    });
    
    LogisticCategory.hasMany(models.LogisticCategory, {
      foreignKey: 'parentCategoryId',
      as: 'children'
    });
    
    LogisticCategory.hasMany(models.LogisticItem, {
      foreignKey: 'categoryId',
      as: 'items'
    });
  };

  return LogisticCategory;
};