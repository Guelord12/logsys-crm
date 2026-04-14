const Redis = require('ioredis');

const redis = new Redis({
  host: 'localhost',
  port: 6379
});

redis.on('connect', () => {
  console.log('✅ Redis est connecté !');
  redis.ping().then(result => {
    console.log('📡 PING réponse:', result);
    redis.quit();
  });
});

redis.on('error', (err) => {
  console.error('❌ Redis non disponible:', err.message);
  process.exit(1);
});