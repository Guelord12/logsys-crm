const axios = require('axios');

async function testDashboard() {
  try {
    // 1. Login
    console.log('🔐 Tentative de connexion...');
    console.log('   URL: http://localhost:5000/api/v1/auth/login');
    
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@logsys.com',
      password: 'Admin@2024'
    });
    
    console.log('✅ Connexion réussie !');
    console.log('   Status:', loginRes.status);
    console.log('   User:', loginRes.data.data.user.email);
    
    const token = loginRes.data.data.tokens.accessToken;
    console.log('   Token obtenu (premiers caractères):', token.substring(0, 50) + '...');
    
    // 2. Test dashboard system
    console.log('\n📊 Test GET /api/v1/dashboard/system...');
    try {
      const systemRes = await axios.get('http://localhost:5000/api/v1/dashboard/system', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Dashboard system - Status:', systemRes.status);
      console.log('   Données:', JSON.stringify(systemRes.data.data.stats, null, 2));
    } catch (err) {
      console.error('❌ Dashboard system - Status:', err.response?.status);
      console.error('   Message:', err.response?.data?.message || err.message);
    }
    
    // 3. Test dashboard stats
    console.log('\n📊 Test GET /api/v1/dashboard/stats...');
    try {
      const statsRes = await axios.get('http://localhost:5000/api/v1/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Dashboard stats - Status:', statsRes.status);
      console.log('   Données:', JSON.stringify(statsRes.data.data, null, 2));
    } catch (err) {
      console.error('❌ Dashboard stats - Status:', err.response?.status);
      console.error('   Message:', err.response?.data?.message || err.message);
    }
    
    // 4. Test dashboard principal
    console.log('\n📊 Test GET /api/v1/dashboard...');
    try {
      const mainRes = await axios.get('http://localhost:5000/api/v1/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Dashboard principal - Status:', mainRes.status);
      console.log('   Données:', JSON.stringify(mainRes.data.data?.stats || mainRes.data.data, null, 2));
    } catch (err) {
      console.error('❌ Dashboard principal - Status:', err.response?.status);
      console.error('   Message:', err.response?.data?.message || err.message);
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR DÉTAILLÉE:');
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'erreur
      console.error('   Status:', error.response.status);
      console.error('   Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('   Pas de réponse du serveur');
      console.error('   Request:', error.request);
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('   Message:', error.message);
    }
    console.error('   Config:', {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data
    });
  }
}

// Vérifier d'abord que le serveur est accessible
async function checkServer() {
  console.log('🔍 Vérification du serveur...');
  try {
    const healthRes = await axios.get('http://localhost:5000/health');
    console.log('✅ Serveur accessible - Status:', healthRes.status);
    console.log('   Réponse:', healthRes.data);
    return true;
  } catch (err) {
    console.error('❌ Serveur INACCESSIBLE !');
    console.error('   Assurez-vous que le backend est démarré sur le port 5000');
    console.error('   Commande: npm run dev');
    return false;
  }
}

async function run() {
  const serverOk = await checkServer();
  if (serverOk) {
    console.log('\n' + '='.repeat(50) + '\n');
    await testDashboard();
  }
}

run();