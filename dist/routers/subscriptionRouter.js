"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscriptionController_1 = __importDefault(require("../controllers/subscriptionController"));
const subscriptionDetectionService_1 = __importDefault(require("../services/subscriptionDetectionService"));
const handleRequest_1 = require("../utils/handleRequest");
const validation_1 = require("../middlewares/validation");
const requests_1 = require("../controllers/requests");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.get('/detect', (0, handleRequest_1.handleRequest)(() => subscriptionDetectionService_1.default.runDetectionForAllUsers(), 200));
router.get('/audit-notify', (0, handleRequest_1.handleRequest)(() => subscriptionDetectionService_1.default.sendMonthlyAuditNotifications(), 200));
router.get('/', authMiddleware_1.authenticateRequest, (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return subscriptionController_1.default.list((_a = req.userId) !== null && _a !== void 0 ? _a : '', req.query.status);
}, 200));
router.patch('/:id/confirm', authMiddleware_1.authenticateRequest, (0, handleRequest_1.handleRequest)((req) => { var _a; return subscriptionController_1.default.confirm(req.params.id, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 200));
router.patch('/:id/dismiss', authMiddleware_1.authenticateRequest, (0, handleRequest_1.handleRequest)((req) => { var _a; return subscriptionController_1.default.dismiss(req.params.id, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 200));
router.post('/:id/convert', (0, validation_1.validateRequest)(requests_1.ConvertSubscriptionRequest), authMiddleware_1.authenticateRequest, (0, handleRequest_1.handleRequest)((req) => { var _a; return subscriptionController_1.default.convert(req.params.id, (_a = req.userId) !== null && _a !== void 0 ? _a : '', req.body); }, 200));
exports.default = router;
