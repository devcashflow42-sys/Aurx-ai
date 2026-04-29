import { Router } from 'express';
import protect from '../middlewares/auth.middleware.js';
import {
  listConversations,
  getConversation,
  upsertConversation,
  renameConversation,
  deleteConversation,
} from '../controllers/conversation.controller.js';

const router = Router();

router.get('/',       protect, listConversations);
router.get('/:id',    protect, getConversation);
router.post('/',      protect, upsertConversation);
router.patch('/:id',  protect, renameConversation);
router.delete('/:id', protect, deleteConversation);

export default router;
