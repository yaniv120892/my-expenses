"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = __importDefault(require("../services/authService"));
const validation_1 = require("../middlewares/validation");
const requests_1 = require("../controllers/requests");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authRouter = (0, express_1.Router)();
const signupHandler = async (req, res) => {
    const { email, username, password } = req.body;
    const result = await authService_1.default.signupUser(email, username, password);
    if (result.error) {
        res.status(400).json({ success: false, error: result.error });
        return;
    }
    res.json({ success: true });
};
const loginHandler = async (req, res) => {
    const { email, username, password } = req.body;
    const result = await authService_1.default.loginUser(email, username, password);
    if (result.error) {
        res.status(400).json({ success: false, error: result.error });
        return;
    }
    res.json({ success: true, token: result.token });
};
const verifyHandler = async (req, res) => {
    const { email, code } = req.body;
    const result = await authService_1.default.verifyLoginCode(email, code);
    if (result.error) {
        res.status(400).json({ error: result.error });
        return;
    }
    res.json({ token: result.token });
};
const logoutHandler = async (req, res) => {
    if (!req.userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    try {
        await authService_1.default.logoutUser(req.userId, req.token || '');
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to logout' });
    }
};
authRouter.post('/signup', (0, validation_1.validateRequest)(requests_1.SignupRequest), signupHandler);
authRouter.post('/login', (0, validation_1.validateRequest)(requests_1.LoginRequest), loginHandler);
authRouter.post('/verify', (0, validation_1.validateRequest)(requests_1.VerifyLoginCodeRequest), verifyHandler);
authRouter.post('/logout', authMiddleware_1.authenticateRequest, logoutHandler);
exports.default = authRouter;
