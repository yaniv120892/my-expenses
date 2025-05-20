"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scheduledTransactionController_1 = __importDefault(require("../controllers/scheduledTransactionController"));
const handleRequest_1 = require("../utils/handleRequest");
const scheduledTransactionService_1 = __importDefault(require("../services/scheduledTransactionService"));
const validation_1 = require("../middlewares/validation");
const requests_1 = require("../controllers/requests");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.get('/process', (0, handleRequest_1.handleRequest)((req) => scheduledTransactionService_1.default.processDueScheduledTransactions(new Date()), 200));
router.post('/', (0, validation_1.validateRequest)(requests_1.CreateScheduledTransactionRequest), authMiddleware_1.authenticateRequest, (0, handleRequest_1.handleRequest)((req) => { var _a; return scheduledTransactionController_1.default.create(req.body, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 201));
router.put('/:id', (0, validation_1.validateRequest)(requests_1.UpdateScheduledTransactionRequest), authMiddleware_1.authenticateRequest, (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return scheduledTransactionController_1.default.update(req.params.id, req.body, (_a = req.userId) !== null && _a !== void 0 ? _a : '');
}, 200));
router.get('/', authMiddleware_1.authenticateRequest, (0, handleRequest_1.handleRequest)((req) => { var _a; return scheduledTransactionController_1.default.list((_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 200));
router.delete('/:id', authMiddleware_1.authenticateRequest, (0, handleRequest_1.handleRequest)((req) => { var _a; return scheduledTransactionController_1.default.delete(req.params.id, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 204));
exports.default = router;
