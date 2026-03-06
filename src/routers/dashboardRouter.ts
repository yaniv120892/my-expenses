import express from 'express';
import dashboardController from '../controllers/dashboardController';
import { handleRequest } from '../utils/handleRequest';
import { authenticateRequest } from '../middlewares/authMiddleware';

const router = express.Router();
router.use(authenticateRequest);

router.get(
  '/',
  handleRequest((req) => dashboardController.getDashboard(req), 200),
);

router.get(
  '/insights',
  handleRequest((req) => dashboardController.getInsights(req), 200),
);

export default router;
