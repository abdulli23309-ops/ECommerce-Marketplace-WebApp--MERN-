import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { appConf } from '../config/init.js';

const setupAppMiddleware = (app) => {
  app.use(helmet({ crossOriginResourcePolicy: false })); // allow cross-origin images
  app.use(cors(appConf.cors));
  if (appConf.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve static files with CORS headers
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static('app/uploads'));
};

export default setupAppMiddleware;