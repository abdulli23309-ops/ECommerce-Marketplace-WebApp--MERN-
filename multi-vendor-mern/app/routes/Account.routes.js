import { Router } from 'express';
import * as accountController from '../controllers/Account.controller.js';
import { authenticate } from '../middleware/Auth.middleware.js';
import { uploadAvatar } from '../helpers/FileUpload.helper.js';

const router = Router();
router.use(authenticate);

router.put('/avatar', authenticate, uploadAvatar, accountController.updateAvatar);
router.put('/password', authenticate, accountController.changePassword);
router.get('/profile', accountController.getProfile);
router.put('/profile', accountController.updateProfile);
router.get('/permissions', accountController.getPermissions);

export default router;
