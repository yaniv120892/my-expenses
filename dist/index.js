"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_1 = __importDefault(require("./routers/index"));
const logger_1 = __importStar(require("./utils/logger"));
const errorHandler_1 = require("./middlewares/errorHandler");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const apiURL = process.env.API_URL || `http://localhost:${PORT}`;
const token = process.env.TELEGRAM_BOT_TOKEN || 'MY_TOKEN';
const bot = new node_telegram_bot_api_1.default(token);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(logger_1.requestLogger);
app.use('/', index_1.default);
const setWebhook = async () => {
    const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3001/webhook';
    logger_1.default.info(`Setting Telegram webhook to: ${webhookUrl}`);
    try {
        await bot.setWebHook(webhookUrl);
        logger_1.default.info('Telegram webhook set successfully');
    }
    catch (err) {
        logger_1.default.error('Error setting webhook:', err);
    }
};
app.listen(PORT, () => {
    logger_1.default.info(`Server is running on ${apiURL}`);
    setWebhook();
});
app.use(errorHandler_1.errorHandler);
