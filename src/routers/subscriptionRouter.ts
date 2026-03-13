import express, { Request } from 'express';
import subscriptionController from '../controllers/subscriptionController';
import subscriptionDetectionService from '../services/subscriptionDetectionService';
import { handleRequest } from '../utils/handleRequest';
import { validateRequest } from '../middlewares/validation';
import { ConvertSubscriptionRequest } from '../controllers/requests';
import { authenticateRequest } from '../middlewares/authMiddleware';

const router = express.Router();

router.get(
  '/detect',
  handleRequest(
    () => subscriptionDetectionService.runDetectionForAllUsers(),
    200,
  ),
);

router.get(
  '/audit-notify',
  handleRequest(
    () => subscriptionDetectionService.sendMonthlyAuditNotifications(),
    200,
  ),
);

router.get(
  '/',
  authenticateRequest,
  handleRequest(
    (req: Request) =>
      subscriptionController.list(
        req.userId ?? '',
        req.query.status as string | undefined,
      ),
    200,
  ),
);

router.patch(
  '/:id/confirm',
  authenticateRequest,
  handleRequest(
    (req: Request) =>
      subscriptionController.confirm(req.params.id, req.userId ?? ''),
    200,
  ),
);

router.patch(
  '/:id/dismiss',
  authenticateRequest,
  handleRequest(
    (req: Request) =>
      subscriptionController.dismiss(req.params.id, req.userId ?? ''),
    200,
  ),
);

router.post(
  '/:id/convert',
  validateRequest(ConvertSubscriptionRequest),
  authenticateRequest,
  handleRequest(
    (req: Request) =>
      subscriptionController.convert(req.params.id, req.userId ?? '', req.body),
    200,
  ),
);

export default router;
