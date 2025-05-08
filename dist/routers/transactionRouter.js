"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transactionController_1 = __importDefault(require("..//controllers/transactionController"));
const validation_1 = require("..//middlewares/validation");
const requests_1 = require("..//controllers/requests");
const handleRequest_1 = require("..//utils/handleRequest");
const router = express_1.default.Router();
router.post('/', (0, validation_1.validateRequest)(requests_1.CreateTransactionRequest), (0, handleRequest_1.handleRequest)((req) => transactionController_1.default.createTransaction(req.body), 201));
router.get('/summary', (0, validation_1.validateRequest)(requests_1.GetTransactionsSummaryRequest, true), (0, handleRequest_1.handleRequest)((req) => transactionController_1.default.getSummary(req.query), 201));
router.get('/', (0, validation_1.validateRequest)(requests_1.GetTransactionsRequest, true), (0, handleRequest_1.handleRequest)((req) => transactionController_1.default.getTransactions({
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
}), 200));
router.put('/:id', (0, validation_1.validateRequest)(requests_1.CreateTransactionRequest), (0, handleRequest_1.handleRequest)((req) => transactionController_1.default.updateTransaction(req.params.id, req.body), 200));
router.delete('/:id', (0, handleRequest_1.handleRequest)((req) => transactionController_1.default.deleteTransaction(req.params.id), 204));
exports.default = router;
