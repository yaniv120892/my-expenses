import express, { Request } from 'express';
import transactionController from '../controllers/transactionController';
import { validateRequest } from '../middlewares/validation';
import {
  CreateTransactionRequest,
  GetTransactionsRequest,
  GetTransactionsSummaryRequest,
  UpdateTransactionRequest,
  UpdateTransactionStatusRequest,
} from '../controllers/requests';
import { handleRequest } from '../utils/handleRequest';
import { TransactionType, TransactionStatus } from '../types/transaction';
import { authenticateRequest } from '../middlewares/authMiddleware';

const router = express.Router();
router.use(authenticateRequest);

router.post(
  '/',
  validateRequest(CreateTransactionRequest),
  handleRequest(
    (req: Request) =>
      transactionController.createTransaction(req.body, req.userId ?? ''),
    201,
  ),
);

router.get(
  '/summary',
  validateRequest(GetTransactionsSummaryRequest, true),
  handleRequest(
    (req: Request) =>
      transactionController.getSummary(req.query, req.userId ?? ''),
    201,
  ),
);

router.get(
  '/',
  validateRequest(GetTransactionsRequest, true),
  handleRequest(
    (req: Request) =>
      transactionController.getTransactions(
        {
          startDate: req.query.startDate
            ? new Date(req.query.startDate as string)
            : undefined,
          endDate: req.query.endDate
            ? new Date(req.query.endDate as string)
            : undefined,
          categoryId: req.query.categoryId as string | undefined,
          type: req.query.type as TransactionType | undefined,
          page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
          perPage: req.query.perPage
            ? parseInt(req.query.perPage as string, 10)
            : 10,
          searchTerm: req.query.searchTerm as string | undefined,
        },
        req.userId ?? '',
      ),
    200,
  ),
);

router.get(
  '/pending',
  handleRequest((req: Request) => {
    return transactionController.getPendingTransactions(req.userId ?? '');
  }, 200),
);

router.put(
  '/:id',
  validateRequest(UpdateTransactionRequest),
  handleRequest(
    (req: Request) =>
      transactionController.updateTransaction(
        req.params.id,
        req.body,
        req.userId ?? '',
      ),
    200,
  ),
);

router.patch(
  '/:id/status',
  validateRequest(UpdateTransactionStatusRequest),
  handleRequest((req: Request) => {
    const status = req.body.status as TransactionStatus;
    return transactionController.updateTransactionStatus(
      req.params.id,
      status,
      req.userId ?? '',
    );
  }, 200),
);

router.delete(
  '/:id',
  handleRequest((req: Request) =>
    transactionController.deleteTransaction(req.params.id, req.userId ?? ''),
  ),
);

export default router;
