const { sequelize } = require('../models');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

const runSeeds = async () => {
  try {
    logger.info('Démarrage des seeds...');
    
    await sequelize.authenticate();

    // Créer l'admin système par défaut
    const { User, Company, UserType } = require('../models');
    
    const adminType = await UserType.findOne({ where: { code: 'SYS_ADMIN' } });
    
    const existingAdmin = await User.findOne({ 
      where: { email: 'admin@logsys.com' } 
    });

    if (!existingAdmin) {
      await User.create({
        email: 'admin@logsys.com',
        firstName: 'Admin',
        lastName: 'System',
        fullName: 'Admin System',
        userTypeId: adminType.id,
        isSystemAdmin: true,
        isCompanyAdmin: false,
        passwordHash: await bcrypt.hash('Admin@2024', 12),
        isTemporaryPassword: false,
        status: 'ACTIVE',
        emailVerified: true
      });
      
      logger.info('✅ Admin système créé (admin@logsys.com / Admin@2024)');
    }

    // Créer les journaux comptables par défaut pour les entreprises existantes
    const { Company: CompanyModel, AccountingJournal } = require('../models');
    
    const companies = await CompanyModel.findAll();
    
    for (const company of companies) {
      const journals = [
        { code: 'AC', name: 'Achats' },
        { code: 'VE', name: 'Ventes' },
        { code: 'BN', name: 'Banque' },
        { code: 'CS', name: 'Caisse' },
        { code: 'OD', name: 'Opérations Diverses' }
      ];

      for (const journal of journals) {
        await AccountingJournal.findOrCreate({
          where: {
            companyId: company.id,
            journalCode: journal.code
          },
          defaults: {
            companyId: company.id,
            journalCode: journal.code,
            journalName: journal.name,
            journalType: journal.code === 'AC' ? 'PURCHASES' : 
                        journal.code === 'VE' ? 'SALES' :
                        journal.code === 'BN' ? 'BANK' :
                        journal.code === 'CS' ? 'CASH' : 'GENERAL'
          }
        });
      }
    }
    
    logger.info('✅ Journaux comptables créés');

    logger.info('✅ Seeds terminés avec succès');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Erreur lors des seeds:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeeds();
}

module.exports = runSeeds;