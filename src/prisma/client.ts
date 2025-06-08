import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { fieldEncryptionExtension } from 'prisma-field-encryption';

const basePrisma = new PrismaClient({
  log: ['warn', 'error'],
});

const encryptedPrisma = basePrisma.$extends(
  fieldEncryptionExtension()
);

const acceleratedAndEncryptedPrisma = encryptedPrisma.$extends(withAccelerate());

export default acceleratedAndEncryptedPrisma;

