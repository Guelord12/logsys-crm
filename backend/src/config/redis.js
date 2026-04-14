const Redis = require('ioredis');
const config = require('./config');
const logger = require('../utils/logger');

// Mode développement sans Redis
const isRedisEnabled = process.env.REDIS_ENABLED !== 'false' && config.redis.host;

const createRedisClient = (options = {}) => {
  if (!isRedisEnabled) {
    logger.info('ℹ️ Redis désactivé - mode développement sans cache');
    // Retourner un client mocké
    return {
      on: () => {},
      get: async () => null,
      set: async () => {},
      setex: async () => {},
      del: async () => {},
      keys: async () => [],
      flushdb: async () => {},
      incr: async () => 1,
      decr: async () => 0,
      call: async () => {},
      status: 'mock'
    };
  }

  const client = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: options.db || config.redis.db,
    keyPrefix: config.redis.keyPrefix,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('⚠️ Redis non disponible - utilisation du mode dégradé');
        return null; // Arrêter de réessayer
      }
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true
  });

  client.on('error', (error) => {
    logger.warn('⚠️ Redis non disponible, utilisation du mode dégradé');
  });

  return client;
};

// Clients mockés si Redis non disponible
const redisClient = createRedisClient();
const redisSubscriber = createRedisClient();
const redisPublisher = createRedisClient();
const redisBull = createRedisClient({ db: 1 });

const cacheService = {
  get: async (key) => {
    try {
      if (!isRedisEnabled) return null;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  },
  set: async (key, value, ttl = 3600) => {
    try {
      if (!isRedisEnabled) return true;
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  },
  del: async () => true,
  clear: async () => true
};

module.exports = {
  redisClient,
  redisSubscriber,
  redisPublisher,
  redisBull,
  cacheService
};