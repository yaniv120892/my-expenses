import { Router } from 'express';
import authService from 'services/authService';

const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;
  const result = await authService.signupUser(email, username, password);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

authRouter.post('/login', async (req, res) => {
  const { email, username, password } = req.body;
  const result = await authService.loginUser(email, username, password);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

authRouter.post('/verify', async (req, res) => {
  const { email, code } = req.body;
  const result = await authService.verifyLoginCode(email, code);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ token: result.token });
});

export default authRouter;
