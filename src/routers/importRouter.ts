import express from 'express';
import { handleRequest } from '../utils/handleRequest';
import {
  ApproveImportedTransactionRequest,
  BatchActionRequest,
  CreateAutoApproveRuleRequest,
  UpdateAutoApproveRuleRequest,
  importController,
  MergeImportedTransactionRequest,
  ProcessImportRequest,
} from '../controllers/importController';
import { validateRequest } from '../middlewares/validation';
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

// Batch operations and auto-approve rules — MUST be before /:importId routes
router.post(
  '/batch-action',
  validateRequest(BatchActionRequest),
  handleRequest(
    (req) => importController.batchAction(req.body, req.userId ?? ''),
    200,
  ),
);

router.get(
  '/auto-approve-rules',
  handleRequest(
    (req) => importController.getAutoApproveRules(req.userId ?? ''),
    200,
  ),
);

router.post(
  '/auto-approve-rules',
  validateRequest(CreateAutoApproveRuleRequest),
  handleRequest(
    (req) =>
      importController.createAutoApproveRule(req.body, req.userId ?? ''),
    200,
  ),
);

router.put(
  '/auto-approve-rules/:ruleId',
  validateRequest(UpdateAutoApproveRuleRequest),
  handleRequest(
    (req) =>
      importController.updateAutoApproveRule(
        req.params.ruleId,
        req.body,
        req.userId ?? '',
      ),
    200,
  ),
);

router.delete(
  '/auto-approve-rules/:ruleId',
  handleRequest(
    (req) =>
      importController.deleteAutoApproveRule(
        req.params.ruleId,
        req.userId ?? '',
      ),
    200,
  ),
);

router.post(
  '/:importId/apply-auto-approve-rules',
  handleRequest(
    (req) =>
      importController.applyAutoApproveRules(
        req.params.importId,
        req.userId ?? '',
      ),
    200,
  ),
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
  '/transactions/:importedTransactionId/ignore',
  handleRequest(
    (req) =>
      importController.ignoreImportedTransaction(
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
