import connectMongo from './Mongo.database.js';
import { connectRedis } from './Redis.database.js';

const initializeDatabases = async () => {
  await connectMongo();
  connectRedis();
};

export default initializeDatabases;
