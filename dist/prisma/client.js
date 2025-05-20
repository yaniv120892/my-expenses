"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { PrismaClient } from '@prisma/client/edge';
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: ['warn', 'error'],
});
exports.default = prisma;
