"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactionFileController_1 = __importDefault(require("../controllers/transactionFileController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const fileUploadMiddleware_1 = require("../middlewares/fileUploadMiddleware");
const router = (0, express_1.Router)();
router.get('/info', transactionFileController_1.default.getFileUploadInfo);
router.post('/transactions/:transactionId/files', authMiddleware_1.authenticateRequest, fileUploadMiddleware_1.uploadSingleFile, transactionFileController_1.default.uploadTransactionFile);
router.get('/transactions/:transactionId/files', authMiddleware_1.authenticateRequest, transactionFileController_1.default.getTransactionFiles);
router.get('/files/:fileId', authMiddleware_1.authenticateRequest, transactionFileController_1.default.getTransactionFileById);
router.put('/files/:fileId', authMiddleware_1.authenticateRequest, fileUploadMiddleware_1.uploadSingleFile, transactionFileController_1.default.updateTransactionFile);
router.delete('/files/:fileId', authMiddleware_1.authenticateRequest, transactionFileController_1.default.deleteTransactionFile);
exports.default = router;
