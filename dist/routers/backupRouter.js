"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const handleRequest_1 = require("../utils/handleRequest");
const backupController_1 = __importDefault(require("../controllers/backupController"));
const router = express_1.default.Router();
router.get('/transactions', (0, handleRequest_1.handleRequest)(() => backupController_1.default.backupTransactions(), 200));
exports.default = router;
