import express from 'express';
import authRouter from './authRouter';
import transactionRouter from './transactionRouter';
import categoryRouter from './categoryRouter';
import summaryRouter from './summaryRouter';
import webhookRouter from './webhookRouter';
import userSettingsRouter from './userSettingsRouter';
import backupRouter from './backupRouter';
import scheduledTransactionRouter from './scheduledTransactionRouter';
import trendRouter from './trendRouter';
import importRouter from './importRouter';
import chatRouter from './chatRouter';

const router = express.Router();

router.use('/api/auth', authRouter);
router.use('/api/transactions', transactionRouter);
router.use('/api/categories', categoryRouter);
router.use('/api/summary', summaryRouter);
router.use('/api/webhook', webhookRouter);
router.use('/api/user/settings', userSettingsRouter);
router.use('/api/backup', backupRouter);
router.use('/api/scheduled-transactions', scheduledTransactionRouter);
router.use('/api/trends', trendRouter);
router.use('/api/imports', importRouter);
router.use('/api/chat', chatRouter);

router.get('/', (req, res) => {
  res.send('ok');
});
export default router;
