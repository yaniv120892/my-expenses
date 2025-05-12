import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import logger from '../utils/logger';

export const validateRequest = (type: any, isQuery: boolean = false) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const requestObj = plainToInstance(type, isQuery ? req.query : req.body);
    const errors = await validate(requestObj);

    if (errors.length > 0) {
      const extractedErrors = errors
        .map((err) => Object.values(err.constraints || {}))
        .flat();

      logger.warn(`Validation failed: ${extractedErrors.join(', ')}`);
      res.status(400).json({
        message: 'Validation failed',
        errors: extractedErrors,
      });
      return;
    }

    if (isQuery) {
      req.query = requestObj as Record<string, any>;
    } else {
      req.body = requestObj;
    }

    next();
  };
};
