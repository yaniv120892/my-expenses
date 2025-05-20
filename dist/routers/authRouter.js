"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = __importDefault(require("services/authService"));
const authRouter = (0, express_1.Router)();
authRouter.post('/signup', async (req, res) => {
    const { email, username, password } = req.body;
    const result = await authService_1.default.signupUser(email, username, password);
    if (result.error) {
        res.status(400).json({ error: result.error });
        return;
    }
    res.json({ success: true });
});
authRouter.post('/login', async (req, res) => {
    const { email, username, password } = req.body;
    const result = await authService_1.default.loginUser(email, username, password);
    if (result.error) {
        res.status(400).json({ error: result.error });
        return;
    }
    res.json({ success: true });
});
authRouter.post('/verify', async (req, res) => {
    const { email, code } = req.body;
    const result = await authService_1.default.verifyLoginCode(email, code);
    if (result.error) {
        res.status(400).json({ error: result.error });
        return;
    }
    res.json({ token: result.token });
});
exports.default = authRouter;
