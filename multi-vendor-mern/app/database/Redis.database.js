import Redis from 'ioredis';
import { dbConf } from '../config/init.js';

let redisClient = null;

const connectRedis = () => {
  redisClient = new Redis({
    host: dbConf.redis.host,
    port: dbConf.redis.port,
    password: dbConf.redis.password,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('⚠️  Redis not available – continuing without cache');
        return null; // stop retrying
      }
      return Math.min(times * 200, 2000);
    },
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  redisClient.on('connect', () => console.log('Redis Connected'));
  redisClient.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      // silently ignore repeated connection refused
    } else {
      console.error('Redis Error:', err);
    }
  });

  // connect manually
  redisClient.connect().catch(() => {
    redisClient = null; // mark unavailable
  });

  return redisClient;
};

const getRedisClient = () => redisClient;

export { connectRedis, getRedisClient };