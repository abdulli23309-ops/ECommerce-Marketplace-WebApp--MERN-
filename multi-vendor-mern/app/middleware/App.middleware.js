import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { appConf } from '../config/init.js';

const setupAppMiddleware = (app) => {
  app.use(helmet());
  app.use(cors(appConf.cors));
  if (appConf.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/uploads', express.static('app/uploads'));
};

export default setupAppMiddleware;
