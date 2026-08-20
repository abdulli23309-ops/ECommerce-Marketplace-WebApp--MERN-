import { Router } from 'express';
import * as googleAuthController from '../controllers/GoogleAuth.controller.js';

const router = Router();

router.post('/', googleAuthController.googleLogin);

export default router;