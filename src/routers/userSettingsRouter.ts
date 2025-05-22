import express, { Request } from 'express';
import userSettingsController from '../controllers/userSettingsController';
import { validateRequest } from '../middlewares/validation';
import {
  UpdateUserSettingsRequest,
  TestTelegramRequest,
} from '../controllers/requests';
import { handleRequest } from '../utils/handleRequest';
import { authenticateRequest } from '../middlewares/authMiddleware';

const router = express.Router();
router.use(authenticateRequest);

router.get(
  '/',
  handleRequest(
    (req: Request) => userSettingsController.getUserSettings(req.userId ?? ''),
    200,
  ),
);

router.put(
  '/',
  validateRequest(UpdateUserSettingsRequest),
  handleRequest(
    (req: Request) =>
      userSettingsController.updateUserSettings(req.userId ?? '', req.body),
    200,
  ),
);

router.post(
  '/testTelegram',
  validateRequest(TestTelegramRequest),
  handleRequest(
    (req: Request) => userSettingsController.testTelegram(req.body.chatId),
    200,
  ),
);

export default router;
