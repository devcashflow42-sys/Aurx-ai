import { Router } from 'express';
import protect from '../middlewares/auth.middleware.js';
import { getProfile, getControl, getTokens } from '../controllers/user.controller.js';

const router = Router();

router.get('/profile', protect, getProfile);
router.get('/control', protect, getControl);
router.get('/tokens',  protect, getTokens);

export default router;
