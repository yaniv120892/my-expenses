import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Errors thrown in this app may carry a status code and a custom name beyond
 * what Error provides, so they are read through an optional-property view
 * rather than assuming the shape.
 */
interface HttpError {
  name?: string;
  message?: string;
  status?: number;
  stack?: string;
}

// `_next` is unused but must stay: Express only treats a handler as error
// middleware when it declares four parameters.
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const error = (err ?? {}) as HttpError;

  if (error.name === 'CustomValidationError') {
    logger.warn(error.message);
    res.status(400).json({ message: error.message });
    return;
  }

  logger.error(error.message || 'Internal Server Error');
  const statusCode = error.status || 500;
  res.status(statusCode).json({
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
