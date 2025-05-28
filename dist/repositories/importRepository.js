"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importRepository = exports.ImportRepository = void 0;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
class ImportRepository {
    async create(data) {
        return client_2.default.import.create({
            data: Object.assign(Object.assign({}, data), { status: client_1.ImportStatus.PROCESSING }),
        });
    }
    async findById(id) {
        return client_2.default.import.findUnique({
            where: { id },
        });
    }
    async findByUserId(userId) {
        return client_2.default.import.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(id, status, error) {
        const data = Object.assign(Object.assign({ status }, (status === client_1.ImportStatus.COMPLETED && { completedAt: new Date() })), (error && { error }));
        return client_2.default.import.update({
            where: { id },
            data,
        });
    }
}
exports.ImportRepository = ImportRepository;
exports.importRepository = new ImportRepository();
