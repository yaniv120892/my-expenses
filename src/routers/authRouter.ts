import { Router } from 'express';
import authService from '../services/authService';
import { validateRequest } from '../middlewares/validation';
import {
  LoginRequest,
  SignupRequest,
  VerifyLoginCodeRequest,
} from '../controllers/requests';

const authRouter = Router();

authRouter.post('/signup', validateRequest(SignupRequest), async (req, res) => {
  const { email, username, password } = req.body;
  const result = await authService.signupUser(email, username, password);
  if (result.error) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true });
});

authRouter.post('/login', validateRequest(LoginRequest), async (req, res) => {
  const { email, username, password } = req.body;
  const result = await authService.loginUser(email, username, password);
  if (result.error) {
    res.status(400).json({ success: false, error: result.error });
    return; 
  }
  res.json({ success: true, token: result.token });
});

authRouter.post(
  '/verify',
  validateRequest(VerifyLoginCodeRequest),
  async (req, res) => {
    const { email, code } = req.body;
    const result = await authService.verifyLoginCode(email, code);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ token: result.token });
  },
);

export default authRouter;
