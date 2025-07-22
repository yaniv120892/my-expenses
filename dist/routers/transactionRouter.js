"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transactionController_1 = __importDefault(require("../controllers/transactionController"));
const transactionFileController_1 = require("../controllers/transactionFileController");
const validation_1 = require("../middlewares/validation");
const requests_1 = require("../controllers/requests");
const handleRequest_1 = require("../utils/handleRequest");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateRequest);
router.post('/', (0, validation_1.validateRequest)(requests_1.CreateTransactionRequest), (0, handleRequest_1.handleRequest)((req) => { var _a; return transactionController_1.default.createTransaction(req.body, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 201));
router.get('/summary', (0, validation_1.validateRequest)(requests_1.GetTransactionsSummaryRequest, true), (0, handleRequest_1.handleRequest)((req) => { var _a; return transactionController_1.default.getSummary(req.query, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }, 201));
router.get('/', (0, validation_1.validateRequest)(requests_1.GetTransactionsRequest, true), (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return transactionController_1.default.getTransactions({
        startDate: req.query.startDate
            ? new Date(req.query.startDate)
            : undefined,
        endDate: req.query.endDate
            ? new Date(req.query.endDate)
            : undefined,
        categoryId: req.query.categoryId,
        type: req.query.type,
        page: req.query.page ? parseInt(req.query.page, 10) : 1,
        perPage: req.query.perPage
            ? parseInt(req.query.perPage, 10)
            : 10,
        searchTerm: req.query.searchTerm,
        smartSearch: req.query.smartSearch !== undefined
            ? req.query.smartSearch === 'true'
            : true,
    }, (_a = req.userId) !== null && _a !== void 0 ? _a : '');
}, 200));
router.get('/pending', (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return transactionController_1.default.getPendingTransactions((_a = req.userId) !== null && _a !== void 0 ? _a : '');
}, 200));
router.put('/:id', (0, validation_1.validateRequest)(requests_1.UpdateTransactionRequest), (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return transactionController_1.default.updateTransaction(req.params.id, req.body, (_a = req.userId) !== null && _a !== void 0 ? _a : '');
}, 200));
router.patch('/:id/status', (0, validation_1.validateRequest)(requests_1.UpdateTransactionStatusRequest), (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    const status = req.body.status;
    return transactionController_1.default.updateTransactionStatus(req.params.id, status, (_a = req.userId) !== null && _a !== void 0 ? _a : '');
}, 200));
router.delete('/:id', (0, handleRequest_1.handleRequest)((req) => { var _a; return transactionController_1.default.deleteTransaction(req.params.id, (_a = req.userId) !== null && _a !== void 0 ? _a : ''); }));
router.post('/:id/attachments', (0, validation_1.validateRequest)(transactionFileController_1.AttachFileRequest), (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return transactionFileController_1.transactionFileController.attachFile(req.params.id, (_a = req.userId) !== null && _a !== void 0 ? _a : '', req.body);
}, 201));
router.get('/:id/attachments', (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return transactionFileController_1.transactionFileController.getTransactionFiles(req.params.id, (_a = req.userId) !== null && _a !== void 0 ? _a : '');
}, 200));
router.delete('/:id/attachments/:fileId', (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return transactionFileController_1.transactionFileController.removeFile(req.params.id, req.params.fileId, (_a = req.userId) !== null && _a !== void 0 ? _a : '');
}, 200));
router.post('/:id/attachments/presign-upload', (0, validation_1.validateRequest)(transactionFileController_1.GetPresignedUploadUrlRequest), (0, handleRequest_1.handleRequest)((req) => {
    var _a;
    return transactionFileController_1.transactionFileController.getPresignedUploadUrl(req.params.id, (_a = req.userId) !== null && _a !== void 0 ? _a : '', req.body);
}));
exports.default = router;
