import { GetTransactionsRequest } from '..//controllers/requests';
import { RequestHandler, Request } from 'express';
import { ParsedQs } from 'qs';

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
