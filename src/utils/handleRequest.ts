import { RequestHandler, Request } from 'express';

export const handleRequest = (
  fn: (param: Request) => Promise<any>,
  status: number = 200,
): RequestHandler => {
  return async (req, res, next) => {
    try {
      const result = await fn(req);
      res.status(status).json(result);
    } catch (error) {
      next(error);
    }
  };
};
