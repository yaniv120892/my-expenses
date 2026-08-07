import { Router } from 'express';
import { authenticateRequest } from '../middlewares/authMiddleware';
import chatController from '../controllers/chatController';

const router = Router();

// Not wrapped in handleRequest: the controller streams SSE frames and ends the
// response itself, while handleRequest always finishes with res.json().
router.post('/', authenticateRequest, chatController.handleChatMessage);

export default router;
