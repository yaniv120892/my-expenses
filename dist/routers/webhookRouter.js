"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webhookController_1 = require("../controllers/webhookController");
const handleTelegramResponse_1 = require("../utils/handleTelegramResponse");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    const chatId = req.body.message.chat.id;
    const token = process.env.TELEGRAM_BOT_TOKEN || 'MY_TOKEN';
    const bot = new node_telegram_bot_api_1.default(token); // Initialize the bot instance
    try {
        const response = await webhookController_1.webhookController.handleWebhook(req.body);
        // Send the response message and handle next step
        await (0, handleTelegramResponse_1.handleResponse)(chatId, response, bot);
        res.status(200).json({ message: 'Success' });
    }
    catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Error occurred' });
    }
});
exports.default = router;
