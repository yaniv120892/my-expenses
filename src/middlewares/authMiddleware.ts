import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import logger from '../utils/logger';
import authService from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      token?: string;
    }
  }
}

interface TokenPayload {
  userId: string;
}

const jwtSecret = process.env.JWT_SECRET || 'defaultSecret';

export const authenticateRequest: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_HEADER_MISSING',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({
      error: 'Invalid token format',
      code: 'INVALID_TOKEN_FORMAT',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
    const isValidSession = await authService.validateSession(
      decoded.userId,
      token,
    );

    if (!isValidSession) {
      res.status(401).json({
        error: 'Session expired',
        code: 'SESSION_EXPIRED',
      });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    logger.error('Authentication error', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
    return;
  }
};
