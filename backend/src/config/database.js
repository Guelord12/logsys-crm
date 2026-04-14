const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging ? (msg) => logger.debug(msg) : false,
    pool: config.database.pool,
    define: config.database.define,
    dialectOptions: {
      ssl: config.database.ssl ? {
        require: true,
        rejectUnauthorized: false
      } : undefined
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Connexion à PostgreSQL établie avec succès');
    
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Modèles synchronisés');
    }
  } catch (error) {
    logger.error('❌ Impossible de se connecter à PostgreSQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };