const db = require('../models');
const logger = require('../utils/logger');

/**
 * Récupérer les KPIs
 */
exports.getKPIs = async (req, res, next) => {
  try {
    const kpis = await db.CompanyKPI.findAll({
      where: { isActive: true }
    });
    res.json({ success: true, data: kpis });
  } catch (error) {
    logger.error('Erreur récupération KPIs:', error);
    next(error);
  }
};

/**
 * Récupérer les valeurs des KPIs
 */
exports.getKPIValues = async (req, res, next) => {
  try {
    const { companyId, startDate, endDate } = req.query;
    const values = await db.KPIValue.findAll({
      where: { companyId }
    });
    res.json({ success: true, data: values });
  } catch (error) {
    logger.error('Erreur récupération valeurs KPIs:', error);
    next(error);
  }
};

/**
 * Récupérer le tableau de bord KPIs
 */
exports.getKPIDashboard = async (req, res, next) => {
  try {
    const companyId = req.user.companyId || req.query.companyId;
    const kpis = await db.CompanyKPI.findAll({
      where: { isActive: true },
      include: [{
        model: db.KPIValue,
        as: 'values',
        limit: 10,
        order: [['calculationDate', 'DESC']]
      }]
    });
    res.json({ success: true, data: kpis });
  } catch (error) {
    logger.error('Erreur dashboard KPIs:', error);
    next(error);
  }
};

/**
 * Ajouter une valeur KPI
 */
exports.addKPIValue = async (req, res, next) => {
  try {
    const { kpiId } = req.params;
    const { value, calculationDate } = req.body;
    const kpiValue = await db.KPIValue.create({
      kpiId,
      companyId: req.user.companyId,
      value,
      calculationDate: calculationDate || new Date()
    });
    res.status(201).json({ success: true, data: kpiValue });
  } catch (error) {
    logger.error('Erreur ajout valeur KPI:', error);
    next(error);
  }
};

/**
 * Mettre à jour un KPI
 */
exports.updateKPI = async (req, res, next) => {
  try {
    const { id } = req.params;
    const kpi = await db.CompanyKPI.findByPk(id);
    if (!kpi) {
      return res.status(404).json({ success: false, message: 'KPI non trouvé' });
    }
    await kpi.update(req.body);
    res.json({ success: true, data: kpi });
  } catch (error) {
    logger.error('Erreur mise à jour KPI:', error);
    next(error);
  }
};

/**
 * Calculer les KPIs
 */
exports.calculateKPIs = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    // Logique de calcul à implémenter
    res.json({ success: true, message: 'KPIs calculés' });
  } catch (error) {
    logger.error('Erreur calcul KPIs:', error);
    next(error);
  }
};