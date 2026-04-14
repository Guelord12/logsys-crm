module.exports = {
  up: async (queryInterface) => {
    const permissions = [
      { module_code: 'DASHBOARD', code: 'DASHBOARD_VIEW', name: 'Voir le tableau de bord', level: 'VIEW' },
      { module_code: 'MESSAGING', code: 'MESSAGE_VIEW', name: 'Voir les messages', level: 'VIEW' },
      { module_code: 'MESSAGING', code: 'MESSAGE_SEND', name: 'Envoyer des messages', level: 'CREATE' },
      { module_code: 'MESSAGING', code: 'MESSAGE_DELETE', name: 'Supprimer des messages', level: 'DELETE' },
      { module_code: 'MEETING', code: 'MEETING_VIEW', name: 'Voir les réunions', level: 'VIEW' },
      { module_code: 'MEETING', code: 'MEETING_CREATE', name: 'Créer des réunions', level: 'CREATE' },
      { module_code: 'LOGISTICS', code: 'LOGISTICS_VIEW', name: 'Voir le module logistique', level: 'VIEW' },
      { module_code: 'LOGISTICS', code: 'LOGISTICS_MANAGE', name: 'Gérer la logistique', level: 'EDIT' },
      { module_code: 'ACCOUNTING', code: 'ACCOUNTING_VIEW', name: 'Voir le module comptable', level: 'VIEW' },
      { module_code: 'ACCOUNTING', code: 'ACCOUNTING_CREATE', name: 'Créer des écritures', level: 'CREATE' },
      { module_code: 'ACCOUNTING', code: 'ACCOUNTING_VALIDATE', name: 'Valider des écritures', level: 'EDIT' },
      { module_code: 'AUDIT', code: 'AUDIT_VIEW', name: 'Voir les logs d\'audit', level: 'VIEW' },
      { module_code: 'ADMIN', code: 'ADMIN_MANAGE_USERS', name: 'Gérer les utilisateurs', level: 'ADMIN' },
      { module_code: 'ADMIN', code: 'ADMIN_MANAGE_COMPANIES', name: 'Gérer les entreprises', level: 'ADMIN' }
    ];

    for (const perm of permissions) {
      const modules = await queryInterface.sequelize.query(
        `SELECT id FROM system_modules WHERE code = '${perm.module_code}'`
      );
      
      if (modules[0].length > 0) {
        await queryInterface.bulkInsert('permissions', [{
          module_id: modules[0][0].id,
          code: perm.code,
          name: perm.name,
          permission_level: perm.level,
          created_at: new Date()
        }]);
      }
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};