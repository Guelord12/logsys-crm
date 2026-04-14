// backend/src/services/moduleAccess.service.js

const db = require('../models');
const logger = require('../utils/logger');

const { User, UserModuleAccess, JobPosition, Company, CompanySubscription } = db;

/**
 * Vérifier si un utilisateur a accès à un module
 */
async function hasModuleAccess(userId, moduleCode, requiredLevel = 'READ') {
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Company,
          as: 'company',
          include: ['activeSubscription']
        },
        {
          model: JobPosition,
          as: 'jobPosition'
        }
      ]
    });
    
    if (!user) return false;
    
    // Admin système a tous les accès
    if (user.isSystemAdmin) return true;
    
    // Vérifier l'abonnement
    const subscription = user.company?.activeSubscription;
    if (!subscription) return false;
    
    const planFeatures = subscription.plan?.features || {};
    if (!planFeatures[moduleCode]) return false;
    
    // Admin entreprise a accès à tous les modules de l'abonnement
    if (user.isCompanyAdmin) return true;
    
    // Vérifier les accès spécifiques
    const access = await UserModuleAccess.findOne({
      where: {
        userId,
        moduleCode,
        isActive: true
      }
    });
    
    if (!access) return false;
    
    // Vérifier le niveau d'accès
    const levels = { 'NONE': 0, 'READ': 1, 'WRITE': 2, 'ADMIN': 3 };
    return levels[access.accessLevel] >= levels[requiredLevel];
    
  } catch (error) {
    logger.error('Erreur vérification accès module:', error);
    return false;
  }
}

/**
 * Récupérer les modules accessibles à un utilisateur
 */
async function getUserAccessibleModules(userId) {
  try {
    const accesses = await UserModuleAccess.findAll({
      where: {
        userId,
        isActive: true
      },
      attributes: ['moduleCode', 'accessLevel']
    });
    
    const modules = {};
    accesses.forEach(access => {
      modules[access.moduleCode] = access.accessLevel;
    });
    
    return modules;
    
  } catch (error) {
    logger.error('Erreur récupération modules accessibles:', error);
    return {};
  }
}

/**
 * Mettre à jour les accès d'un utilisateur selon son poste
 */
async function syncUserModuleAccess(userId) {
  try {
    const user = await User.findByPk(userId, {
      include: ['jobPosition', 'company']
    });
    
    if (!user) return;
    
    // Appeler la fonction PostgreSQL
    await db.sequelize.query(
      'SELECT update_user_module_access(:userId, :positionId, :isAdmin)',
      {
        replacements: {
          userId: user.id,
          positionId: user.jobPositionId,
          isAdmin: user.isCompanyAdmin
        }
      }
    );
    
    logger.info(`Accès modules synchronisés pour l'utilisateur ${userId}`);
    
  } catch (error) {
    logger.error('Erreur synchronisation accès modules:', error);
  }
}

/**
 * Middleware Express pour vérifier l'accès à un module
 */
function requireModuleAccess(moduleCode, requiredLevel = 'READ') {
  return async (req, res, next) => {
    try {
      const hasAccess = await hasModuleAccess(req.user.id, moduleCode, requiredLevel);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Accès au module ${moduleCode} non autorisé ou niveau insuffisant`
        });
      }
      
      next();
      
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  hasModuleAccess,
  getUserAccessibleModules,
  syncUserModuleAccess,
  requireModuleAccess
};