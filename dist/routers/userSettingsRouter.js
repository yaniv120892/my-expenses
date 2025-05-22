"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userSettingsController_1 = __importDefault(require("../controllers/userSettingsController"));
const validation_1 = require("../middlewares/validation");
const requests_1 = require("../controllers/requests");
const handleRequest_1 = require("../utils/handleRequest");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateRequest);
router.post('/test-telegram', (0, validation_1.validateRequest)(requests_1.TestTelegramRequest), (0, handleRequest_1.handleRequest)((req) => userSettingsController_1.default.testTelegram(req.body.chatId), 200));
router.get('/', (0, handleRequest_1.handleRequest)((req) => { var _a; return userSettingsController_1.default.getUserSettings((_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 200));
router.put('/', (0, validation_1.validateRequest)(requests_1.UpdateUserSettingsRequest), (0, handleRequest_1.handleRequest)((req) => { var _a; return userSettingsController_1.default.updateUserSettings((_a = req.userId) !== null && _a !== void 0 ? _a : '', req.body); }, 200));
exports.default = router;
