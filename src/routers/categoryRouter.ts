import express, { Request } from 'express';
import { handleRequest } from '@app/utils/handleRequest';
import categoryController from '@app/controllers/categoryController';

const router = express.Router();

router.get(
  '/',
  handleRequest((_req: Request) => categoryController.getAllCategories(), 200),
);

export default router;
