const { sequelize } = require('./src/models');

async function fix() {
  try {
    console.log('🔧 Démarrage des corrections...');
    
    // Vérifier si la colonne updated_at existe, sinon l'ajouter
    const tables = ['system_modules', 'countries', 'business_sectors', 'job_positions', 'user_types', 'notification_types', 'task_types'];
    
    for (const table of tables) {
      try {
        // Vérifier si la colonne existe
        const [result] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = 'updated_at'
        `);
        
        if (result.length === 0) {
          console.log(`➕ Ajout de updated_at à ${table}`);
          await sequelize.query(`
            ALTER TABLE ${table} 
            ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          `);
        }
        
        // Mettre à jour les NULL
        await sequelize.query(`
          UPDATE ${table} 
          SET updated_at = created_at 
          WHERE updated_at IS NULL
        `);
        
        console.log(`✅ ${table} corrigé`);
      } catch (err) {
        console.log(`⚠️ ${table}: ${err.message}`);
      }
    }
    
    console.log('✅ Toutes les corrections sont terminées !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  
  await sequelize.close();
  process.exit(0);
}

fix();