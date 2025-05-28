"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const handleRequest_1 = require("../utils/handleRequest");
const importController_1 = require("../controllers/importController");
const validation_1 = require("../middlewares/validation");
const importController_2 = require("../controllers/importController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateRequest);
router.post('/process', (0, validation_1.validateRequest)(importController_2.ProcessImportRequest), (0, handleRequest_1.handleRequest)((req) => { var _a; return importController_1.importController.processImport(req.body, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 200));
router.get('/', (0, handleRequest_1.handleRequest)((req) => { var _a; return importController_1.importController.getImports((_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 200));
router.get('/:importId/transactions', (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return importController_1.importController.getImportedTransactions({ importId: req.params.importId }, (_a = req.userId) !== null && _a !== void 0 ? _a : '');
}, 200));
router.post('/transactions/:importedTransactionId/approve', (0, validation_1.validateRequest)(importController_1.ApproveImportedTransactionRequest), (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return importController_1.importController.approveImportedTransaction(req.params.importedTransactionId, (_a = req.userId) !== null && _a !== void 0 ? _a : '', req.body);
}, 200));
router.post('/transactions/:importedTransactionId/merge', (0, validation_1.validateRequest)(importController_1.MergeImportedTransactionRequest), (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return importController_1.importController.mergeImportedTransaction(req.params.importedTransactionId, (_a = req.userId) !== null && _a !== void 0 ? _a : '', req.body);
}, 200));
router.post('/transactions/:importedTransactionId/reject', (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return importController_1.importController.rejectImportedTransaction(req.params.importedTransactionId, (_a = req.userId) !== null && _a !== void 0 ? _a : '');
}, 200));
router.delete('/transactions/:importedTransactionId', (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return importController_1.importController.deleteImportedTransaction(req.params.importedTransactionId, (_a = req.userId) !== null && _a !== void 0 ? _a : '');
}, 200));
exports.default = router;
