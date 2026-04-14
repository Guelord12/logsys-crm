const Joi = require('joi');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors
      });
    }

    req[property] = value;
    next();
  };
};

const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().default(false)
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    phoneNumber: Joi.string().allow(null, ''),
    phoneCountryCode: Joi.string().allow(null, ''),
    companyId: Joi.string().uuid().allow(null),
    userTypeId: Joi.number().integer().positive().required(),
    jobPositionId: Joi.number().integer().positive().allow(null),
    isCompanyAdmin: Joi.boolean().default(false),
    roles: Joi.array().items(Joi.number()).default([])
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),

  createCompany: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    legalName: Joi.string().allow(''),
    taxNumber: Joi.string().allow(''),
    businessSectorId: Joi.number().integer().positive().required(),
    countryId: Joi.number().integer().positive().required(),
    address: Joi.string().required(),
    city: Joi.string().allow(''),
    postalCode: Joi.string().allow(''),
    email: Joi.string().email().required(),
    phoneCountryCode: Joi.string().allow(''),
    phoneNumber: Joi.string().allow(''),
    website: Joi.string().allow(''),
    executiveName: Joi.string().required(),
    executivePositionId: Joi.number().integer().positive().required(),
    executiveEmail: Joi.string().email().required(),
    executivePhoneCode: Joi.string().allow(''),
    executivePhone: Joi.string().allow(''),
    adminFirstName: Joi.string().required(),
    adminLastName: Joi.string().required(),
    adminEmail: Joi.string().email().required(),
    adminPhoneCountryCode: Joi.string().allow(''),
    adminPhoneNumber: Joi.string().allow(''),
    adminJobPositionId: Joi.number().integer().positive().required(),
    planCode: Joi.string().valid('BASIC', 'PRO', 'ENTERPRISE').default('BASIC'),
    userCount: Joi.number().integer().min(1).default(5)
  }),

  updateCompany: Joi.object({
    name: Joi.string().min(2).max(200),
    legalName: Joi.string().allow(''),
    taxNumber: Joi.string().allow(''),
    businessSectorId: Joi.number().integer().positive(),
    countryId: Joi.number().integer().positive(),
    address: Joi.string(),
    city: Joi.string().allow(''),
    postalCode: Joi.string().allow(''),
    email: Joi.string().email(),
    phoneCountryCode: Joi.string().allow(''),
    phoneNumber: Joi.string().allow(''),
    website: Joi.string().allow(''),
    status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED', 'PENDING')
  }),

  updateSubscription: Joi.object({
    planCode: Joi.string().valid('BASIC', 'PRO', 'ENTERPRISE'),
    userCount: Joi.number().integer().min(1),
    action: Joi.string().valid('upgrade', 'downgrade', 'cancel', 'reactivate').required()
  }),

  sendMessage: Joi.object({
    subject: Joi.string().allow(''),
    body: Joi.string().required(),
    recipients: Joi.array().items(Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string(),
      type: Joi.string().valid('TO', 'CC', 'BCC').default('TO')
    })).min(1).required(),
    attachments: Joi.array().items(Joi.string()),
    scheduledFor: Joi.date().iso().allow(null)
  }),

  createMeeting: Joi.object({
    title: Joi.string().min(3).max(500).required(),
    description: Joi.string().allow(''),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
    timezone: Joi.string().default('UTC'),
    meetingType: Joi.string().valid('VIDEO', 'AUDIO', 'WEBINAR', 'IN_PERSON').default('VIDEO'),
    participants: Joi.array().items(Joi.object({
      userId: Joi.string().uuid(),
      email: Joi.string().email(),
      name: Joi.string(),
      role: Joi.string().valid('ORGANIZER', 'PRESENTER', 'ATTENDEE', 'GUEST').default('ATTENDEE')
    })).min(1),
    settings: Joi.object({
      enableWaitingRoom: Joi.boolean().default(true),
      allowChat: Joi.boolean().default(true),
      allowRecording: Joi.boolean().default(false),
      muteParticipantsOnEntry: Joi.boolean().default(true)
    }).default({})
  }),

  createTask: Joi.object({
    title: Joi.string().min(3).max(500).required(),
    description: Joi.string().allow(''),
    taskTypeId: Joi.number().integer().positive(),
    assignedTo: Joi.string().uuid(),
    startDate: Joi.date().iso(),
    dueDate: Joi.date().iso(),
    estimatedHours: Joi.number().min(0),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').default('MEDIUM'),
    tags: Joi.array().items(Joi.string())
  }),

  createAccountingEntry: Joi.object({
    periodId: Joi.string().uuid().required(),
    journalId: Joi.string().uuid().required(),
    entryDate: Joi.date().iso().required(),
    description: Joi.string().required(),
    lines: Joi.array().items(Joi.object({
      accountNumber: Joi.string().required(),
      debitAmount: Joi.number().min(0).default(0),
      creditAmount: Joi.number().min(0).default(0),
      description: Joi.string().allow('')
    })).min(2).required()
  })
};

module.exports = {
  validate,
  schemas
};