"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionFileRepository = void 0;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
class TransactionFileRepository {
    async create(data) {
        return client_2.default.transactionFile.create({
            data: Object.assign(Object.assign({}, data), { status: client_1.TransactionFileStatus.ACTIVE }),
        });
    }
    async findById(id) {
        return client_2.default.transactionFile.findUnique({
            where: { id },
        });
    }
    async findByTransactionId(transactionId) {
        return client_2.default.transactionFile.findMany({
            where: {
                transactionId,
                status: client_1.TransactionFileStatus.ACTIVE,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(id, status) {
        return client_2.default.transactionFile.update({
            where: { id },
            data: { status },
        });
    }
    async markForDeletion(id) {
        return this.updateStatus(id, client_1.TransactionFileStatus.MARKED_FOR_DELETION);
    }
}
exports.TransactionFileRepository = TransactionFileRepository;
exports.default = new TransactionFileRepository();
