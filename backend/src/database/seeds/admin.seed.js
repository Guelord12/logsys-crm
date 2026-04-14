const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const userTypes = await queryInterface.sequelize.query(
      `SELECT id FROM user_types WHERE code = 'SYS_ADMIN'`
    );
    
    if (userTypes[0].length > 0) {
      await queryInterface.bulkInsert('users', [{
        id: require('uuid').v4(),
        user_code: 'ADMIN001',
        email: 'admin@logsys.com',
        first_name: 'Admin',
        last_name: 'System',
        full_name: 'Admin System',
        user_type_id: userTypes[0][0].id,
        is_system_admin: true,
        is_company_admin: false,
        password_hash: await bcrypt.hash('Admin@2024', 12),
        is_temporary_password: false,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', { email: 'admin@logsys.com' }, {});
  }
};