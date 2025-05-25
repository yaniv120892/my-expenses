import express from 'express';
import trendController from '../controllers/trendController';
import { handleRequest } from '../utils/handleRequest';
import { authenticateRequest } from '../middlewares/authMiddleware';

const router = express.Router();
router.use(authenticateRequest);

router.get(
  '/',
  handleRequest((req) => trendController.getSpendingTrends(req), 200),
);

router.get(
  '/categories',
  handleRequest((req) => trendController.getCategorySpendingTrends(req), 200),
);

export default router;
