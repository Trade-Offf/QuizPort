import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const datasourceUrl = process.env.DATABASE_URL;

export const prisma: PrismaClient =
  global.prisma ?? new PrismaClient({ datasourceUrl }).$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

