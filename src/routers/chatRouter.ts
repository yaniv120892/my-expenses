import { Router } from 'express';
import { authenticateRequest } from '../middlewares/authMiddleware';
import { handleRequest } from '../utils/handleRequest';
import chatController from '../controllers/chatController';

const router = Router();

router.post('/', authenticateRequest, handleRequest(
    (req) => chatController.handleChatMessage(req.body.messages, req.userId ?? ''),
    200,
  ),
);

export default router;
