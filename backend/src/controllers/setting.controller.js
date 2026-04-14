const db = require('../models');
const logger = require('../utils/logger');

const { SystemSetting, CompanySetting, AuditLog } = db;

/**
 * Récupérer les paramètres système
 */
exports.getSettings = async (req, res, next) => {
  try {
    const where = req.user.isSystemAdmin ? {} : { isPublic: true };
    
    const settings = await SystemSetting.findAll({ where });

    const settingsObj = {};
    settings.forEach(s => {
      let value = s.settingValue;
      if (s.settingType === 'NUMBER') value = parseFloat(value);
      else if (s.settingType === 'BOOLEAN') value = value === 'true';
      else if (s.settingType === 'JSON') value = JSON.parse(value);
      settingsObj[s.settingKey] = value;
    });

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    logger.error('Erreur récupération paramètres:', error);
    next(error);
  }
};

/**
 * Récupérer les paramètres publics
 */
exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.findAll({
      where: { isPublic: true }
    });

    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.settingKey] = s.settingValue;
    });

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    logger.error('Erreur récupération paramètres publics:', error);
    next(error);
  }
};

/**
 * Mettre à jour un paramètre système
 */
exports.updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await SystemSetting.findOne({ where: { settingKey: key } });

    if (!setting) {
      return res.status(404).json({ success: false, message: 'Paramètre non trouvé' });
    }

    let stringValue = value;
    if (typeof value === 'object') stringValue = JSON.stringify(value);
    else stringValue = String(value);

    await setting.update({ 
      settingValue: stringValue, 
      updatedBy: req.user.id 
    });

    await AuditLog.create({
      userId: req.user.id,
      actionType: 'UPDATE',
      entityType: 'SYSTEM_SETTING',
      entityId: setting.id,
      actionDescription: `Mise à jour paramètre ${key}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Paramètre mis à jour' });
  } catch (error) {
    logger.error('Erreur mise à jour paramètre:', error);
    next(error);
  }
};

/**
 * Récupérer les paramètres de l'entreprise
 */
exports.getCompanySettings = async (req, res, next) => {
  try {
    const settings = await CompanySetting.findAll({
      where: { companyId: req.user.companyId }
    });

    const settingsObj = {};
    settings.forEach(s => {
      let value = s.settingValue;
      if (s.settingType === 'NUMBER') value = parseFloat(value);
      else if (s.settingType === 'BOOLEAN') value = value === 'true';
      settingsObj[s.settingKey] = value;
    });

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    logger.error('Erreur récupération paramètres entreprise:', error);
    next(error);
  }
};

/**
 * Mettre à jour un paramètre de l'entreprise
 */
exports.updateCompanySetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const [setting] = await CompanySetting.findOrCreate({
      where: { companyId: req.user.companyId, settingKey: key },
      defaults: { 
        settingValue: String(value), 
        settingType: typeof value === 'number' ? 'NUMBER' : 'STRING',
        updatedBy: req.user.id 
      }
    });

    if (!setting.isNewRecord) {
      await setting.update({ 
        settingValue: String(value), 
        updatedBy: req.user.id 
      });
    }

    res.json({ success: true, message: 'Paramètre mis à jour' });
  } catch (error) {
    logger.error('Erreur mise à jour paramètre entreprise:', error);
    next(error);
  }
};