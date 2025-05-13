"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const scheduledTransactionService_1 = __importDefault(require("../services/scheduledTransactionService"));
async function run() {
    const today = new Date();
    await scheduledTransactionService_1.default.processDueScheduledTransactions(today);
    process.exit(0);
}
run();
