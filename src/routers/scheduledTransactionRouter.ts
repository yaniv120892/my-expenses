import express, { Request } from 'express';
import scheduledTransactionController from '../controllers/scheduledTransactionController';
import { handleRequest } from '../utils/handleRequest';
import scheduledTransactionService from '../services/scheduledTransactionService';
import { validateRequest } from '../middlewares/validation';
import {
  CreateScheduledTransactionRequest,
  UpdateScheduledTransactionRequest,
} from '../controllers/requests';

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
    (req: Request) => scheduledTransactionController.create(req.body),
    201,
  ),
);

router.put(
  '/:id',
  validateRequest(UpdateScheduledTransactionRequest),
  handleRequest(
    (req: Request) =>
      scheduledTransactionController.update(req.params.id, req.body),
    200,
  ),
);

router.get(
  '/',
  handleRequest(() => scheduledTransactionController.list(), 200),
);

router.delete(
  '/:id',
  handleRequest(
    (req: Request) => scheduledTransactionController.delete(req.params.id),
    204,
  ),
);

export default router;
