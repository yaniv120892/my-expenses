import express, { Request } from 'express';
import scheduledTransactionController from '../controllers/scheduledTransactionController';
import { handleRequest } from '../utils/handleRequest';
import scheduledTransactionService from '../services/scheduledTransactionService';
import { validateRequest } from '../middlewares/validation';
import {
  CreateScheduledTransactionRequest,
  UpdateScheduledTransactionRequest,
} from '../controllers/requests';
import { authenticateRequest } from '../middlewares/authMiddleware';

const router = express.Router();

router.get(
  '/process',
  handleRequest(
    (req: Request) =>
      scheduledTransactionService.processDueScheduledTransactions(new Date()),
    200,
  ),
);

router.post(
  '/',
  validateRequest(CreateScheduledTransactionRequest),
  handleRequest(
    (req: Request) =>
      scheduledTransactionController.create(req.body, req.userId ?? ''),
    201,
  ),
);

router.put(
  '/:id',
  validateRequest(UpdateScheduledTransactionRequest),
  authenticateRequest,
  handleRequest(
    (req: Request) =>
      scheduledTransactionController.update(
        req.params.id,
        req.body,
        req.userId ?? '',
      ),
    200,
  ),
);

router.get(
  '/',
  handleRequest(
    (req: Request) => scheduledTransactionController.list(req.userId ?? ''),
    200,
  ),
);

router.delete(
  '/:id',
  handleRequest(
    (req: Request) =>
      scheduledTransactionController.delete(req.params.id, req.userId ?? ''),
    204,
  ),
);

export default router;
