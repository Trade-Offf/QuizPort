import { prisma } from '@/lib/prisma';
import { okJson } from '@/lib/http';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(Number(url.searchParams.get('page') || '1'), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') || '20'), 1), 50);
  const where = { status: 'public' as const };
  const total = await prisma.quizSet.count({ where });
  const items = await prisma.quizSet.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: { slug: true, title: true, description: true, createdAt: true },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return okJson({ items, page, pageSize, total });
}

export const runtime = 'nodejs';


