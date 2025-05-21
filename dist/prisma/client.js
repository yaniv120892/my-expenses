"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const edge_1 = require("@prisma/client/edge");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
const prisma = new edge_1.PrismaClient({
    log: ['warn', 'error'],
}).$extends((0, extension_accelerate_1.withAccelerate)());
exports.default = prisma;
