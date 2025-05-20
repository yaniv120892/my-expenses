"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
class UserRepository {
    async findById(userId) {
        return client_1.default.user.findUnique({ where: { id: userId } });
    }
    async findByEmailOrUsername(email, username) {
        return client_1.default.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
    }
    async createUser(email, username, hashedPassword) {
        return client_1.default.user.create({
            data: { email, username, password: hashedPassword, verified: false },
        });
    }
    async findByEmail(email) {
        return client_1.default.user.findUnique({ where: { email } });
    }
    async verifyUser(email) {
        return client_1.default.user.update({
            where: { email },
            data: { verified: true },
        });
    }
}
exports.default = new UserRepository();
