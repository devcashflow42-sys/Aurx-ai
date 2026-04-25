import { Router } from 'express';
import protect from '../middlewares/auth.middleware.js';
import { chat, chatStream, getModels } from '../controllers/ai.controller.js';

const router = Router();

router.post('/chat',   protect, chat);
router.post('/stream', protect, chatStream);
router.get('/models',  protect, getModels);

export default router;
