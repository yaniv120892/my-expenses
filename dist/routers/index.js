"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transactionRouter_1 = __importDefault(require("../routers/transactionRouter"));
const categoryRouter_1 = __importDefault(require("../routers/categoryRouter"));
const webhookRouter_1 = __importDefault(require("../routers/webhookRouter"));
const scheduledTransactionRouter_1 = __importDefault(require("../routers/scheduledTransactionRouter"));
const scheduledTransactionService_1 = __importDefault(require("../services/scheduledTransactionService"));
const router = express_1.default.Router();
router.use('/webhook', webhookRouter_1.default);
router.use('/api/transactions', transactionRouter_1.default);
router.use('/api/scheduled-transactions', scheduledTransactionRouter_1.default);
router.use('/api/categories', categoryRouter_1.default);
router.post('/api/process-scheduled-transactions', async (req, res, next) => {
    try {
        const today = new Date();
        await scheduledTransactionService_1.default.processDueScheduledTransactions(today);
        res.status(200).json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
router.get('/', (req, res) => {
    res.send('ok');
});
exports.default = router;
