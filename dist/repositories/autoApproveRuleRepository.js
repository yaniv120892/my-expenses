"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoApproveRuleRepository = exports.AutoApproveRuleRepository = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class AutoApproveRuleRepository {
    async create(data) {
        return client_1.default.autoApproveRule.create({ data });
    }
    async findByUserId(userId) {
        return client_1.default.autoApproveRule.findMany({
            where: { userId },
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        return client_1.default.autoApproveRule.findUnique({
            where: { id },
            include: { category: true },
        });
    }
    async update(id, userId, data) {
        return client_1.default.autoApproveRule.update({
            where: { id, userId },
            data,
        });
    }
    async delete(id, userId) {
        await client_1.default.autoApproveRule.delete({
            where: { id, userId },
        });
    }
    async findActiveByUserId(userId) {
        return client_1.default.autoApproveRule.findMany({
            where: { userId, isActive: true },
        });
    }
}
exports.AutoApproveRuleRepository = AutoApproveRuleRepository;
exports.autoApproveRuleRepository = new AutoApproveRuleRepository();
