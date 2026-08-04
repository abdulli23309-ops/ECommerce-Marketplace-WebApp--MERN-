import { Router } from 'express';
import * as publicController from '../controllers/Product.public.controller.js';

const router = Router();

router.get('/', publicController.getAll);
router.get('/:id', publicController.getById);

export default router;