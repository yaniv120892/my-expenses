import { Request, Response, NextFunction } from 'express';
import logger from '@app/utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err.name === 'CustomValidationError') {
    logger.warn(err.message);
    res.status(400).json({ message: err.message });
    return;
  }

  logger.error(err.message || 'Internal Server Error');
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
