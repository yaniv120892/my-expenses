import 'reflect-metadata';
import 'tsconfig-paths/register';
import express from 'express';
import router from '@app/routers/index';
import logger, { requestLogger } from '@app/utils/logger';
import { errorHandler } from '@app/middlewares/errorHandler';
import * as dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(requestLogger);

app.use('/', router);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
