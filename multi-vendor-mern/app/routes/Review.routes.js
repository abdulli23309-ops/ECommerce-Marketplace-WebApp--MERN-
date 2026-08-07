import { Router } from 'express';
import * as reviewController from '../controllers/Review.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';

const router = Router();

// ---- Authenticated routes ----
router.get('/mine', authenticate, reviewController.getMyReviews);          // <-- MUST be first
router.post('/', authenticate, reviewController.createReview);

// ---- Public route ----
router.get('/product/:productId', reviewController.getProductReviews);     // now after /mine
router.get('/:id', authenticate, reviewController.getReviewById);

export default router;