import express, { Request } from 'express';
import scheduledTransactionController from '../controllers/scheduledTransactionController';
import { handleRequest } from '../utils/handleRequest';
import scheduledTransactionService from '../services/scheduledTransactionService';

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
  handleRequest(
    (req: Request) => scheduledTransactionController.create(req.body),
    201,
  ),
);

router.put(
  '/:id',
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
