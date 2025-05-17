import express from 'express';
import transactionRouter from '../routers/transactionRouter';
import categoryRouter from '../routers/categoryRouter';
import webhookRouter from '../routers/webhookRouter';
import scheduledTransactionRouter from '../routers/scheduledTransactionRouter';
import summaryRouter from '../routers/summaryRouter';

const router = express.Router();
router.use('/webhook', webhookRouter);
router.use('/api/transactions', transactionRouter);
router.use('/api/scheduled-transactions', scheduledTransactionRouter);
router.use('/api/categories', categoryRouter);
router.use('/api/summary', summaryRouter);

router.get('/', (req, res) => {
  res.send('ok');
});
export default router;
