import express from 'express';
import transactionRouter from '@src/routers/transactionRouter';
import categoryRouter from '@src/routers/categoryRouter';

const router = express.Router();

router.get('/ping', (req, res) => {
  res.send('ok');
});
router.use('/transactions', transactionRouter);
router.use('/categories', categoryRouter);

export default router;
