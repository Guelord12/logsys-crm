const db = require('../models');

async function initPeriods() {
  try {
    const { AccountingPeriod } = db;
    
    // Périodes pour l'admin système (company_id = null)
    const periods = [
      { periodCode: '2024-01', periodName: 'Exercice 2024', startDate: '2024-01-01', endDate: '2024-12-31' },
      { periodCode: '2024-Q1', periodName: '1er Trimestre 2024', startDate: '2024-01-01', endDate: '2024-03-31' },
      { periodCode: '2024-04', periodName: 'Avril 2024', startDate: '2024-04-01', endDate: '2024-04-30' },
    ];
    
    for (const p of periods) {
      const [period, created] = await AccountingPeriod.findOrCreate({
        where: { periodCode: p.periodCode, companyId: null },
        defaults: p
      });
      console.log(created ? `✅ Période ${p.periodCode} créée` : `⏭️ Période ${p.periodCode} existe déjà`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

initPeriods();