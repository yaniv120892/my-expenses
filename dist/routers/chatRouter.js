"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const chatController_1 = __importDefault(require("../controllers/chatController"));
const router = (0, express_1.Router)();
// Not wrapped in handleRequest: the controller streams SSE frames and ends the
// response itself, while handleRequest always finishes with res.json().
router.post('/', authMiddleware_1.authenticateRequest, chatController_1.default.handleChatMessage);
exports.default = router;
