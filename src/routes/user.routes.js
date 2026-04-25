import { Router } from 'express';
import protect from '../middlewares/auth.middleware.js';
import { getProfile, getControl } from '../controllers/user.controller.js';

const router = Router();

router.get('/profile', protect, getProfile);
router.get('/control', protect, getControl);

export default router;
