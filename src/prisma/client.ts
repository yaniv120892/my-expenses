import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
}).$extends(withAccelerate());

export default prisma;
