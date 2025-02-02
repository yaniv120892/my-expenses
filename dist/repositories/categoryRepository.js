"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class CategoryRepository {
    async getAllCategories() {
        return await prisma.category.findMany({
            select: {
                id: true,
                name: true,
            },
        });
    }
    async getCategoryById(id) {
        return await prisma.category.findUnique({
            where: { id },
        });
    }
}
exports.CategoryRepository = CategoryRepository;
exports.default = new CategoryRepository();
