import appKeys from './app.keys.js';

export default {
  ...appKeys,
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
};
