"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scheduledTransactionController_1 = __importDefault(require("../controllers/scheduledTransactionController"));
const handleRequest_1 = require("../utils/handleRequest");
const scheduledTransactionService_1 = __importDefault(require("../services/scheduledTransactionService"));
const router = express_1.default.Router();
router.get('/process', (0, handleRequest_1.handleRequest)((req) => scheduledTransactionService_1.default.processDueScheduledTransactions(new Date()), 200));
router.post('/', (0, handleRequest_1.handleRequest)((req) => scheduledTransactionController_1.default.create(req.body), 201));
router.put('/:id', (0, handleRequest_1.handleRequest)((req) => scheduledTransactionController_1.default.update(req.params.id, req.body), 200));
router.get('/', (0, handleRequest_1.handleRequest)(() => scheduledTransactionController_1.default.list(), 200));
router.delete('/:id', (0, handleRequest_1.handleRequest)((req) => scheduledTransactionController_1.default.delete(req.params.id), 204));
exports.default = router;
