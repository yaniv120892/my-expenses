"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const transactionService_1 = __importDefault(require("../services/transactionService"));
class TransactionController {
    createTransaction(createTransactionRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug('Start create transaction', createTransactionRequest);
                const transactionId = yield transactionService_1.default.createTransaction(createTransactionRequest);
                logger_1.default.debug('Done create transaction', createTransactionRequest, transactionId);
                return transactionId;
            }
            catch (error) {
                logger_1.default.error(`Failed to create transaction, ${JSON.stringify(createTransactionRequest)}, ${error.message}`);
                throw error;
            }
        });
    }
    getTransactions(getTransactionsRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug('Start get transactions', getTransactionsRequest);
                const transactions = yield transactionService_1.default.getTransactions(getTransactionsRequest);
                logger_1.default.debug('Done get transactions', getTransactionsRequest, transactions);
                return transactions;
            }
            catch (error) {
                logger_1.default.error(`Failed to get transactions, ${error.message}`);
                throw error;
            }
        });
    }
    getSummary(getTransactionsRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.debug('Start get transactions summary', getTransactionsRequest);
                const summary = yield transactionService_1.default.getTransactionsSummary(getTransactionsRequest);
                logger_1.default.debug('Done get transactions summary', getTransactionsRequest, summary);
                return summary;
            }
            catch (error) {
                logger_1.default.error(`Failed to get transactions summary, ${error.message}`);
                throw error;
            }
        });
    }
}
exports.default = new TransactionController();
