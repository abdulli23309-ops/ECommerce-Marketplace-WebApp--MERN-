import { Router } from 'express';
import express from 'express';          // <-- required for express.raw
import * as webhookController from '../controllers/Webhook.controller.js';

const router = Router();

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook
);

export default router;