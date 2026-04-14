const { sequelize } = require('../models');
const logger = require('../utils/logger');
const fs = require('fs-extra');
const path = require('path');

const runMigrations = async () => {
  try {
    logger.info('Démarrage des migrations...');
    
    await sequelize.authenticate();
    logger.info('✅ Connexion à la base de données établie');

    // Synchroniser les modèles
    await sequelize.sync({ alter: true });
    logger.info('✅ Modèles synchronisés');

    // Exécuter le script schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (await fs.pathExists(schemaPath)) {
      const schema = await fs.readFile(schemaPath, 'utf-8');
      await sequelize.query(schema);
      logger.info('✅ Schema.sql exécuté');
    }

    logger.info('✅ Migrations terminées avec succès');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Erreur lors des migrations:', error);
    process.exit(1);
  }
};

// Exécuter si appelé directement
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;