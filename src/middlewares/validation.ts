import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export const validateRequest = (type: any, isQuery: boolean = false) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Use req.query if isQuery is true, otherwise use req.body
    const requestObj = plainToInstance(type, isQuery ? req.query : req.body);
    const errors = await validate(requestObj);

    if (errors.length > 0) {
      const extractedErrors = errors
        .map((err) => Object.values(err.constraints || {}))
        .flat();

      // Send response directly, but don't return it
      res.status(400).json({
        message: 'Validation failed',
        errors: extractedErrors,
      });
      return; // Prevent further execution
    }

    // Assign validated object back to the request
    if (isQuery) {
      // Cast the validated object to match ParsedQs
      req.query = requestObj as Record<string, any>; // For query parameters
    } else {
      req.body = requestObj; // For request body
    }

    next(); // Proceed to the next middleware/controller
  };
};
