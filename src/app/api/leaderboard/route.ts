import { prisma } from '@/lib/prisma';
import { okJson } from '@/lib/http';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = (url.searchParams.get('range') || 'all') as 'weekly'|'monthly'|'all';
  const limit = Number(url.searchParams.get('limit') || 100);

  // MVP：直接按总 points 排行；range 可拓展为基于 PointsLog 时间窗口聚合
  const users = await prisma.user.findMany({
    orderBy: { points: 'desc' },
    take: Math.min(Math.max(limit, 1), 100),
    select: { id: true, username: true, avatarUrl: true, points: true },
  });
  return okJson({ range, users });
}

export const runtime = 'nodejs';

