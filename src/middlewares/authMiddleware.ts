import jwt from 'jsonwebtoken';
import 'express';
import { Request, Response, NextFunction } from 'express';
import userRepository from '../repositories/userRepository';
import logger from '../utils/logger';

declare module 'express' {
  export interface Request {
    userId?: string;
  }
}

const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';

export const authenticateRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.headers.authorization) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const userId =
      typeof payload === 'object' && 'userId' in payload
        ? payload.userId
        : undefined;
    if (!userId) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    if (!user.verified) {
      res.status(401).json({ error: 'User not verified' });
      return;
    }
    req.userId = user.id;
    next();
  } catch (error) {
    logger.error('Failed to authenticate request', error, req.headers);
    res.status(500).json({ error: 'Internal server error' });
  }
};
