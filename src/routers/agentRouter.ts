import express, { Request } from 'express';
import agentController from '../controllers/agentController';
import { authenticateRequest } from '../middlewares/authMiddleware';
import { handleRequest } from '../utils/handleRequest';

const router = express.Router();
router.use(authenticateRequest);

router.post(
  '/messages',
  handleRequest((req: Request) =>
    agentController.sendMessage(req.body, req.userId ?? ''),
  ),
);

router.post(
  '/pending-actions/:id/confirm',
  handleRequest((req: Request) =>
    agentController.confirmPendingAction(req.params.id, req.userId ?? ''),
  ),
);

export default router;
