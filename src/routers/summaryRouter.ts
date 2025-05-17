import express from 'express';
import { handleRequest } from '../utils/handleRequest';
import summaryController from '../controllers/summaryController';

const router = express.Router();

router.get(
  '/today',
  handleRequest(() => summaryController.sendTodaySummary(), 200),
);

export default router;
