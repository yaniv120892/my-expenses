"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const agentController_1 = __importDefault(require("../controllers/agentController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const handleRequest_1 = require("../utils/handleRequest");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateRequest);
router.post('/messages', (0, handleRequest_1.handleRequest)((req) => { var _a; return agentController_1.default.sendMessage(req.body, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }));
router.post('/pending-actions/:id/confirm', (0, handleRequest_1.handleRequest)((req) => { var _a; return agentController_1.default.confirmPendingAction(req.params.id, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }));
exports.default = router;
