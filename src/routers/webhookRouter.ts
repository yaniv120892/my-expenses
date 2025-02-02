import express, { Request, Response } from 'express';
import { webhookController } from '../controllers/webhookController';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    await webhookController.handleWebhook(req.body);
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'Error occurred' });
  }
});

export default router;
