"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transactionRouter_1 = __importDefault(require("../routers/transactionRouter"));
const categoryRouter_1 = __importDefault(require("../routers/categoryRouter"));
const webhookRouter_1 = __importDefault(require("../routers/webhookRouter"));
const router = express_1.default.Router();
router.use('/webhook', webhookRouter_1.default);
router.use('/api/transactions', transactionRouter_1.default);
router.use('/api/scheduled-transactions', transactionRouter_1.default);
router.use('/api/categories', categoryRouter_1.default);
router.get('/', (req, res) => {
    res.send('ok');
});
exports.default = router;
