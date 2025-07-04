"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const handleRequest_1 = require("../utils/handleRequest");
const chatController_1 = __importDefault(require("../controllers/chatController"));
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.authenticateRequest, (0, handleRequest_1.handleRequest)((req) => { var _a; return chatController_1.default.handleChatMessage(req.body.messages, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 200));
exports.default = router;
