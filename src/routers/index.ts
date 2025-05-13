import express from 'express';
import transactionRouter from '../routers/transactionRouter';
import categoryRouter from '../routers/categoryRouter';
import webhookRouter from '../routers/webhookRouter';
import scheduledTransactionRouter from '../routers/scheduledTransactionRouter';
import scheduledTransactionService from '../services/scheduledTransactionService';

const router = express.Router();
router.use('/webhook', webhookRouter);
router.use('/api/transactions', transactionRouter);
router.use('/api/scheduled-transactions', scheduledTransactionRouter);
router.use('/api/categories', categoryRouter);

router.post('/api/process-scheduled-transactions', async (req, res, next) => {
  try {
    const today = new Date();
    await scheduledTransactionService.processDueScheduledTransactions(today);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/', (req, res) => {
  res.send('ok');
});
export default router;
