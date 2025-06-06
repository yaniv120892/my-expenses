import { Router, RequestHandler } from 'express';
import authService from '../services/authService';
import { validateRequest } from '../middlewares/validation';
import {
  LoginRequest,
  SignupRequest,
  VerifyLoginCodeRequest,
} from '../controllers/requests';
import { authenticateRequest } from '../middlewares/authMiddleware';

const authRouter = Router();

const signupHandler: RequestHandler = async (req, res) => {
  const { email, username, password } = req.body;
  const result = await authService.signupUser(email, username, password);
  if (result.error) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true });
};

const loginHandler: RequestHandler = async (req, res) => {
  const { email, username, password } = req.body;
  const result = await authService.loginUser(email, username, password);
  if (result.error) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true, token: result.token });
};

const verifyHandler: RequestHandler = async (req, res) => {
  const { email, code } = req.body;
  const result = await authService.verifyLoginCode(email, code);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ token: result.token });
};

const logoutHandler: RequestHandler = async (req, res) => {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    await authService.logoutUser(req.userId, req.token || '');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
};

authRouter.post('/signup', validateRequest(SignupRequest), signupHandler);
authRouter.post('/login', validateRequest(LoginRequest), loginHandler);
authRouter.post(
  '/verify',
  validateRequest(VerifyLoginCodeRequest),
  verifyHandler,
);
authRouter.post('/logout', authenticateRequest, logoutHandler);

export default authRouter;
