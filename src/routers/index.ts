import express from 'express';
import transactionRouter from '@app/routers/transactionRouter';
import categoryRouter from '@app/routers/categoryRouter';

const router = express.Router();
router.use('/api/transactions', transactionRouter);
router.use('/api/categories', categoryRouter);
router.get('/', (req, res) => {
  res.send('ok');
});
export default router;
