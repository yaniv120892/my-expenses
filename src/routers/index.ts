import express from 'express';
import transactionRouter from '@src/routers/transactionRouter';
import categoryRouter from '@src/routers/categoryRouter';

const router = express.Router();
router.use('/api/transactions', transactionRouter);
router.use('/api/categories', categoryRouter);
router.get('/ping', (req, res) => {
  res.send('ok');
});
export default router;
