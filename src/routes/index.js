import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import aiRoutes from './ai.routes.js';
import conversationRoutes from './conversation.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/ai', aiRoutes);
router.use('/conversations', conversationRoutes);

export default router;
