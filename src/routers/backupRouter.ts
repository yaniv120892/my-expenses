import express from 'express';
import { handleRequest } from '../utils/handleRequest';
import backupController from '../controllers/backupController';

const router = express.Router();

//TODO: trigger this endpoint from a cron job
router.get(
  '/transactions',
  handleRequest(() => backupController.backupTransactions(), 200),
);

export default router;
