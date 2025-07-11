import { Router } from 'express';
import transactionFileController from '../controllers/transactionFileController';
import { authenticateRequest } from '../middlewares/authMiddleware';
import { uploadSingleFile } from '../middlewares/fileUploadMiddleware';

const router = Router();

router.get('/info', transactionFileController.getFileUploadInfo);

router.post(
  '/transactions/:transactionId/files',
  authenticateRequest,
  uploadSingleFile,
  transactionFileController.uploadTransactionFile
);

router.get(
  '/transactions/:transactionId/files',
  authenticateRequest,
  transactionFileController.getTransactionFiles
);

router.get(
  '/files/:fileId',
  authenticateRequest,
  transactionFileController.getTransactionFileById
);

router.put(
  '/files/:fileId',
  authenticateRequest,
  uploadSingleFile,
  transactionFileController.updateTransactionFile
);

router.delete(
  '/files/:fileId',
  authenticateRequest,
  transactionFileController.deleteTransactionFile
);

export default router;