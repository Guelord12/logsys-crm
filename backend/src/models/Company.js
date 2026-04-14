module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'company_code'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    legalName: {
      type: DataTypes.STRING(200),
      field: 'legal_name'
    },
    taxNumber: {
      type: DataTypes.STRING(100),
      unique: true,
      field: 'tax_number'
    },
    businessSectorId: {
      type: DataTypes.INTEGER,
      field: 'business_sector_id'
    },
    countryId: {
      type: DataTypes.INTEGER,
      field: 'country_id'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(100)
    },
    postalCode: {
      type: DataTypes.STRING(20),
      field: 'postal_code'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phoneCountryCode: {
      type: DataTypes.STRING(10),
      field: 'phone_country_code'
    },
    phoneNumber: {
      type: DataTypes.STRING(50),
      field: 'phone_number'
    },
    logoUrl: {
      type: DataTypes.TEXT,
      field: 'logo_url'
    },
    website: {
      type: DataTypes.STRING(255),
      validate: {
        isUrl: true
      }
    },
    executiveName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'executive_name'
    },
    executivePositionId: {
      type: DataTypes.INTEGER,
      field: 'executive_position_id'
    },
    executiveEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      },
      field: 'executive_email'
    },
    executivePhoneCode: {
      type: DataTypes.STRING(10),
      field: 'executive_phone_code'
    },
    executivePhone: {
      type: DataTypes.STRING(50),
      field: 'executive_phone'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED', 'PENDING'),
      defaultValue: 'PENDING'
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED'),
      defaultValue: 'TRIAL',
      field: 'subscription_status'
    },
    registrationDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      field: 'registration_date'
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by'
    },
    lastModifiedBy: {
      type: DataTypes.UUID,
      field: 'last_modified_by'
    }
  }, {
    tableName: 'companies',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (company) => {
        if (!company.companyCode) {
          company.companyCode = `COMP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        }
      }
    }
  });

  Company.associate = (models) => {
    // Vérifier que les modèles existent avant de créer les associations
    if (models.BusinessSector) {
      Company.belongsTo(models.BusinessSector, {
        foreignKey: 'businessSectorId',
        as: 'businessSector'
      });
    }

    if (models.Country) {
      Company.belongsTo(models.Country, {
        foreignKey: 'countryId',
        as: 'country'
      });
    }

    if (models.JobPosition) {
      Company.belongsTo(models.JobPosition, {
        foreignKey: 'executivePositionId',
        as: 'executivePosition'
      });
    }

    if (models.User) {
      Company.hasMany(models.User, {
        foreignKey: 'companyId',
        as: 'users'
      });

      Company.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });

      Company.belongsTo(models.User, {
        foreignKey: 'lastModifiedBy',
        as: 'modifier'
      });
    }

    if (models.CompanySubscription) {
      Company.hasMany(models.CompanySubscription, {
        foreignKey: 'companyId',
        as: 'subscriptions'
      });

      Company.hasOne(models.CompanySubscription, {
        foreignKey: 'companyId',
        as: 'activeSubscription',
        scope: {
          status: 'ACTIVE'
        }
      });
    }

    if (models.Role) {
      Company.hasMany(models.Role, {
        foreignKey: 'companyId',
        as: 'roles'
      });
    }

    if (models.Warehouse) {
      Company.hasMany(models.Warehouse, {
        foreignKey: 'companyId',
        as: 'warehouses'
      });
    }

    if (models.LogisticItem) {
      Company.hasMany(models.LogisticItem, {
        foreignKey: 'companyId',
        as: 'logisticItems'
      });
    }

    if (models.AccountingPeriod) {
      Company.hasMany(models.AccountingPeriod, {
        foreignKey: 'companyId',
        as: 'accountingPeriods'
      });
    }

    if (models.Document) {
      Company.hasMany(models.Document, {
        foreignKey: 'companyId',
        as: 'documents'
      });
    }

    if (models.Notification) {
      Company.hasMany(models.Notification, {
        foreignKey: 'companyId',
        as: 'notifications'
      });
    }

    if (models.AuditLog) {
      Company.hasMany(models.AuditLog, {
        foreignKey: 'companyId',
        as: 'auditLogs'
      });
    }

    if (models.Meeting) {
      Company.hasMany(models.Meeting, {
        foreignKey: 'companyId',
        as: 'meetings'
      });
    }

    if (models.Task) {
      Company.hasMany(models.Task, {
        foreignKey: 'companyId',
        as: 'tasks'
      });
    }
  };

  return Company;
};