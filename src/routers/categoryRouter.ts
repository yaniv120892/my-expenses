import express, { Request } from 'express';
import { handleRequest } from '@src/utils/handleRequest';
import categoryController from '@src/controllers/categoryController';

const router = express.Router();

router.get(
  '/',
  handleRequest((_req: Request) => categoryController.getAllCategories(), 200),
);

export default router;
