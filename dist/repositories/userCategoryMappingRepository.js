"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
class UserCategoryMappingRepository {
    async findByUserAndDescription(userId, descriptionPattern) {
        return client_1.default.userCategoryMapping.findUnique({
            where: {
                userId_descriptionPattern: { userId, descriptionPattern },
            },
            select: { categoryId: true },
        });
    }
    async upsert(userId, descriptionPattern, categoryId) {
        await client_1.default.userCategoryMapping.upsert({
            where: {
                userId_descriptionPattern: { userId, descriptionPattern },
            },
            update: {
                categoryId,
                hitCount: { increment: 1 },
            },
            create: {
                userId,
                descriptionPattern,
                categoryId,
            },
        });
    }
}
exports.default = new UserCategoryMappingRepository();
