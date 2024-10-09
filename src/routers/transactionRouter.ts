import express, { Request } from 'express';
import transactionController from '@app/controllers/transactionController';
import { validateRequest } from '@app/middlewares/validation';
import {
  CreateTransactionRequest,
  GetTransactionsRequest,
  GetTransactionsSummaryRequest,
} from '@app/controllers/requests';
import { handleRequest } from '@app/utils/handleRequest';
import { TransactionType } from '@app/types/transaction';

const router = express.Router();

router.post(
  '/',
  validateRequest(CreateTransactionRequest),
  handleRequest(
    (req: Request) => transactionController.createTransaction(req.body),
    201,
  ),
);

router.get(
  '/summary',
  validateRequest(GetTransactionsSummaryRequest, true),
  handleRequest(
    (req: Request) => transactionController.getSummary(req.query),
    201,
  ),
);

router.get(
  '/',
  validateRequest(GetTransactionsRequest, true),
  handleRequest(
    (req: Request) =>
      transactionController.getTransactions({
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        categoryId: req.query.categoryId as string,
        type: req.query.type as TransactionType,
        page: parseInt(req.query.page as string, 10) || 1,
        perPage: parseInt(req.query.perPage as string, 10) || 10,
        searchTerm: req.query.searchTerm as string,
      }),
    200,
  ),
);

export default router;
