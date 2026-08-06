import appKeys from './app.keys.js';

export default {
  ...appKeys,
  cors: {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
},
};
