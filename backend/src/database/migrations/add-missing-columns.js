const { sequelize } = require('../../models');

async function addMissingColumns() {
  try {
    console.log('🔧 Ajout des colonnes manquantes...');

    // Liste des colonnes à ajouter
    const alterations = [
      // deleted_at
      `ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`,
      
      // updated_at
      `ALTER TABLE system_modules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE countries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE business_sectors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE user_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE notification_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE task_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      
      // created_by / last_modified_by
      `ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES users(id)`,
      `ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id)`,
      
      // Mise à jour des NULL
      `UPDATE system_modules SET updated_at = created_at WHERE updated_at IS NULL`,
      `UPDATE countries SET updated_at = created_at WHERE updated_at IS NULL`,
      `UPDATE business_sectors SET updated_at = created_at WHERE updated_at IS NULL`,
      `UPDATE job_positions SET updated_at = created_at WHERE updated_at IS NULL`,
      `UPDATE user_types SET updated_at = created_at WHERE updated_at IS NULL`,
      `UPDATE notification_types SET updated_at = created_at WHERE updated_at IS NULL`,
      `UPDATE task_types SET updated_at = created_at WHERE updated_at IS NULL`,
      `UPDATE subscription_plans SET updated_at = created_at WHERE updated_at IS NULL`,
      `UPDATE permissions SET updated_at = created_at WHERE updated_at IS NULL`
    ];

    for (const sql of alterations) {
      try {
        await sequelize.query(sql);
        console.log(`✅ ${sql.substring(0, 60)}...`);
      } catch (err) {
        console.log(`⚠️ Erreur ignorée: ${err.message.substring(0, 50)}`);
      }
    }

    console.log('✅ Toutes les colonnes manquantes ont été ajoutées !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
  
  await sequelize.close();
  process.exit(0);
}

addMissingColumns();