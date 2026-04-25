import { Router } from 'express';
import protect from '../middlewares/auth.middleware.js';
import { chat, getModels } from '../controllers/ai.controller.js';

const router = Router();

router.post('/chat', protect, chat);
router.get('/models', protect, getModels);

export default router;
