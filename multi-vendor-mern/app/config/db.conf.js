import dbKeys from './db.keys.js';

export default {
  mongo: {
    uri: dbKeys.mongoUri,
    options: {},
  },
  redis: dbKeys.redis,
};
