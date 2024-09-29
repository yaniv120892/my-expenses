import 'reflect-metadata';
import express from 'express';
import router from '@src/routers/index';
import logger, { requestLogger } from '@src/utils/logger';
import { errorHandler } from '@src/middlewares/errorHandler';
import * as dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(requestLogger);

app.use('/api', router);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
