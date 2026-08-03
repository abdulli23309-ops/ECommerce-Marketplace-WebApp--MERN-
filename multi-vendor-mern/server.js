import app from './app/app.js';
import { appConf } from './app/config/init.js';
import initializeDatabases from './app/database/init.js';

const start = async () => {
  await initializeDatabases();
  app.listen(appConf.port, () => {
    console.log(`Server Running in ${appConf.nodeEnv} mode on port ${appConf.port}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
