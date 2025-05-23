import express from 'express';
import transactionRouter from '../routers/transactionRouter';
import categoryRouter from '../routers/categoryRouter';
import webhookRouter from '../routers/webhookRouter';
import scheduledTransactionRouter from '../routers/scheduledTransactionRouter';
import summaryRouter from '../routers/summaryRouter';
import backupRouter from '../routers/backupRouter';
import authRouter from '../routers/authRouter';
import userSettingsRouter from '../routers/userSettingsRouter';

const router = express.Router();
router.use('/webhook', webhookRouter);
router.use('/api/transactions', transactionRouter);
router.use('/api/scheduled-transactions', scheduledTransactionRouter);
router.use('/api/categories', categoryRouter);
router.use('/api/summary', summaryRouter);
router.use('/api/backup', backupRouter);
router.use('/api/auth', authRouter);
router.use('/api/user/settings', userSettingsRouter);

router.get('/', (req, res) => {
  res.send('ok');
});
export default router;
