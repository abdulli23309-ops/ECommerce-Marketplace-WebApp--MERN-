import mongoose from 'mongoose';
import { dbConf } from '../config/init.js';

const connectMongo = async () => {
  try {
    const conn = await mongoose.connect(dbConf.mongo.uri, {
      retryWrites: false,   // ← add this
    });
    console.log(`Mongo Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Mongo Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectMongo;