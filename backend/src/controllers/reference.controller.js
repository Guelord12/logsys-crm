const db = require('../models');
const logger = require('../utils/logger');

const { Country, BusinessSector, JobPosition, UserType, SubscriptionPlan } = db;

/**
 * Récupérer tous les pays
 */
exports.getCountries = async (req, res, next) => {
  try {
    const countries = await Country.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    logger.error('Erreur récupération pays:', error);
    next(error);
  }
};

/**
 * Récupérer tous les secteurs d'activité
 */
exports.getBusinessSectors = async (req, res, next) => {
  try {
    const sectors = await BusinessSector.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: sectors
    });
  } catch (error) {
    logger.error('Erreur récupération secteurs:', error);
    next(error);
  }
};

/**
 * Récupérer tous les postes
 */
exports.getJobPositions = async (req, res, next) => {
  try {
    const positions = await JobPosition.findAll({
      where: { isActive: true },
      order: [['hierarchyLevel', 'ASC'], ['title', 'ASC']]
    });

    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    logger.error('Erreur récupération postes:', error);
    next(error);
  }
};

/**
 * Récupérer tous les types d'utilisateurs
 */
exports.getUserTypes = async (req, res, next) => {
  try {
    const types = await UserType.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    logger.error('Erreur récupération types utilisateurs:', error);
    next(error);
  }
};

/**
 * Récupérer tous les plans d'abonnement
 */
exports.getSubscriptionPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      order: [['pricePerUser', 'ASC']]
    });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    logger.error('Erreur récupération plans:', error);
    next(error);
  }
};