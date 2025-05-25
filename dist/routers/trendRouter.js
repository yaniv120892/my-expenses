"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const trendController_1 = __importDefault(require("../controllers/trendController"));
const handleRequest_1 = require("../utils/handleRequest");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateRequest);
router.get('/', (0, handleRequest_1.handleRequest)((req) => trendController_1.default.getSpendingTrends(req), 200));
router.get('/categories', (0, handleRequest_1.handleRequest)((req) => trendController_1.default.getCategorySpendingTrends(req), 200));
exports.default = router;
