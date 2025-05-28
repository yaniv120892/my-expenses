import express from 'express';
import { handleRequest } from '../utils/handleRequest';
import {
  ApproveImportedTransactionRequest,
  importController,
  MergeImportedTransactionRequest,
} from '../controllers/importController';
import { validateRequest } from '../middlewares/validation';
import { ProcessImportRequest } from '../controllers/importController';
import { authenticateRequest } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticateRequest);

router.post(
  '/process',
  validateRequest(ProcessImportRequest),
  handleRequest(
    (req) => importController.processImport(req.body, req.userId ?? ''),
    200,
  ),
);

router.get(
  '/',
  handleRequest((req) => importController.getImports(req.userId ?? ''), 200),
);

router.get(
  '/:importId/transactions',
  handleRequest(
    (req) =>
      importController.getImportedTransactions(
        { importId: req.params.importId },
        req.userId ?? '',
      ),
    200,
  ),
);

router.post(
  '/transactions/:importedTransactionId/approve',
  validateRequest(ApproveImportedTransactionRequest),
  handleRequest(
    (req) =>
      importController.approveImportedTransaction(
        req.params.importedTransactionId,
        req.userId ?? '',
        req.body,
      ),
    200,
  ),
);

router.post(
  '/transactions/:importedTransactionId/merge',
  validateRequest(MergeImportedTransactionRequest),
  handleRequest(
    (req) =>
      importController.mergeImportedTransaction(
        req.params.importedTransactionId,
        req.userId ?? '',
        req.body,
      ),
    200,
  ),
);

router.post(
  '/transactions/:importedTransactionId/reject',
  handleRequest(
    (req) =>
      importController.rejectImportedTransaction(
        req.params.importedTransactionId,
        req.userId ?? '',
      ),
    200,
  ),
);

router.delete(
  '/transactions/:importedTransactionId',
  handleRequest(
    (req) =>
      importController.deleteImportedTransaction(
        req.params.importedTransactionId,
        req.userId ?? '',
      ),
    200,
  ),
);

export default router;
