import express, { Request } from 'express';
import { handleRequest } from '..//utils/handleRequest';
import categoryController from '..//controllers/categoryController';

const router = express.Router();

router.get(
  '/',
  handleRequest((_req: Request) => categoryController.list(), 200),
);

export default router;
