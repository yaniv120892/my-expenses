"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webhookController_1 = require("../controllers/webhookController");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    try {
        await webhookController_1.webhookController.handleWebhook(req.body);
        res.status(200).json({ message: 'Success' });
    }
    catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Error occurred' });
    }
});
exports.default = router;
