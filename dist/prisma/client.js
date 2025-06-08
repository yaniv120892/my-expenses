"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const edge_1 = require("@prisma/client/edge");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
const prisma_field_encryption_1 = require("prisma-field-encryption");
const basePrisma = new edge_1.PrismaClient({
    log: ['warn', 'error'],
});
const encryptedPrisma = basePrisma.$extends((0, prisma_field_encryption_1.fieldEncryptionExtension)());
const acceleratedAndEncryptedPrisma = encryptedPrisma.$extends((0, extension_accelerate_1.withAccelerate)());
exports.default = acceleratedAndEncryptedPrisma;
