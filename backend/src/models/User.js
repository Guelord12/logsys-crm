const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userCode: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'user_code'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    username: {
      type: DataTypes.STRING(100),
      unique: true
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    firstName: {
      type: DataTypes.STRING(100),
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(100),
      field: 'last_name'
    },
    fullName: {
      type: DataTypes.STRING(200),
      field: 'full_name'
    },
    phoneCountryCode: {
      type: DataTypes.STRING(10),
      field: 'phone_country_code'
    },
    phoneNumber: {
      type: DataTypes.STRING(50),
      field: 'phone_number'
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      field: 'avatar_url'
    },
    companyId: {
      type: DataTypes.UUID,
      field: 'company_id'
    },
    userTypeId: {
      type: DataTypes.INTEGER,
      field: 'user_type_id'
    },
    jobPositionId: {
      type: DataTypes.INTEGER,
      field: 'job_position_id'
    },
    isSystemAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_system_admin'
    },
    isCompanyAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_company_admin'
    },
    isTemporaryPassword: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_temporary_password'
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      field: 'password_changed_at'
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      field: 'password_reset_token'
    },
    passwordResetExpiresAt: {
      type: DataTypes.DATE,
      field: 'password_reset_expires_at'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      field: 'email_verification_token'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_ACTIVATION'),
      defaultValue: 'PENDING_ACTIVATION'
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'failed_login_attempts'
    },
    lockedUntil: {
      type: DataTypes.DATE,
      field: 'locked_until'
    },
    languagePreference: {
      type: DataTypes.STRING(10),
      defaultValue: 'fr',
      field: 'language_preference'
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC'
    },
    notificationPreferences: {
      type: DataTypes.JSONB,
      defaultValue: { email: true, sms: true, push: true },
      field: 'notification_preferences'
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_enabled'
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      field: 'two_factor_secret'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at'
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      field: 'last_activity_at'
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by'
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at'
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    paranoid: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, config.security.bcryptSaltRounds);
        }
        if (!user.userCode) {
          user.userCode = `USR${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        }
        if (!user.fullName && (user.firstName || user.lastName)) {
          user.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, config.security.bcryptSaltRounds);
          user.passwordChangedAt = new Date();
          user.isTemporaryPassword = false;
        }
        if (user.changed('firstName') || user.changed('lastName')) {
          user.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
      }
    }
  });

  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
  };

  User.prototype.generateAuthToken = function() {
    return jwt.sign(
      { id: this.id, email: this.email, companyId: this.companyId, isSystemAdmin: this.isSystemAdmin, isCompanyAdmin: this.isCompanyAdmin },
      config.jwt.secret,
      { expiresIn: `${config.jwt.accessExpirationMinutes}m` }
    );
  };

  User.prototype.generateRefreshToken = function() {
    return jwt.sign(
      { id: this.id, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: `${config.jwt.refreshExpirationDays}d` }
    );
  };

  User.prototype.generatePasswordResetToken = function() {
    const token = jwt.sign(
      { id: this.id, type: 'password_reset' },
      config.jwt.secret,
      { expiresIn: `${config.jwt.resetPasswordExpirationMinutes}m` }
    );
    this.passwordResetToken = token;
    this.passwordResetExpiresAt = new Date(Date.now() + config.jwt.resetPasswordExpirationMinutes * 60 * 1000);
    return token;
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.passwordHash;
    delete values.passwordResetToken;
    delete values.twoFactorSecret;
    return values;
  };

  User.associate = (models) => {
    if (models.Company) {
      User.belongsTo(models.Company, {
        foreignKey: 'companyId',
        as: 'company'
      });
    }

    if (models.UserType) {
      User.belongsTo(models.UserType, {
        foreignKey: 'userTypeId',
        as: 'userType'
      });
    }

    if (models.JobPosition) {
      User.belongsTo(models.JobPosition, {
        foreignKey: 'jobPositionId',
        as: 'jobPosition'
      });
    }

    if (models.User) {
      User.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }

    if (models.UserSession) {
      User.hasMany(models.UserSession, {
        foreignKey: 'userId',
        as: 'sessions'
      });
    }

    if (models.LoginHistory) {
      User.hasMany(models.LoginHistory, {
        foreignKey: 'userId',
        as: 'loginHistory'
      });
    }

    if (models.UserRole) {
      User.hasMany(models.UserRole, {
        foreignKey: 'userId',
        as: 'userRoles'
      });
    }

    // CORRECTION : Ajouter l'association belongsToMany avec Role
    if (models.Role) {
      User.belongsToMany(models.Role, {
        through: models.UserRole,
        foreignKey: 'userId',
        otherKey: 'roleId',
        as: 'roles'
      });
    }

    if (models.UserPermission) {
      User.hasMany(models.UserPermission, {
        foreignKey: 'userId',
        as: 'directPermissions'
      });
    }

    if (models.Notification) {
      User.hasMany(models.Notification, {
        foreignKey: 'userId',
        as: 'notifications'
      });
    }

    if (models.Message) {
      User.hasMany(models.Message, {
        foreignKey: 'senderId',
        as: 'sentMessages'
      });
    }

    if (models.Task) {
      User.hasMany(models.Task, {
        foreignKey: 'assignedTo',
        as: 'assignedTasks'
      });
    }

    if (models.AuditLog) {
      User.hasMany(models.AuditLog, {
        foreignKey: 'userId',
        as: 'auditLogs'
      });
    }
  };

  return User;
};