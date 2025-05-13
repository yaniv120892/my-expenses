import express from 'express';
import transactionRouter from '../routers/transactionRouter';
import categoryRouter from '../routers/categoryRouter';
import webhookRouter from '../routers/webhookRouter';

const router = express.Router();
router.use('/webhook', webhookRouter);
router.use('/api/transactions', transactionRouter);
router.use('/api/scheduled-transactions', transactionRouter);
router.use('/api/categories', categoryRouter);
router.get('/', (req, res) => {
  res.send('ok');
});
export default router;
