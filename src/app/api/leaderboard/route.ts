import { okJson } from '@/lib/http';
import { dbQuery } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = (url.searchParams.get('range') || 'all') as 'weekly'|'monthly'|'all';
  const limit = Number(url.searchParams.get('limit') || 100);

  // MVP：直接按总 points 排行；range 可拓展为基于 PointsLog 时间窗口聚合
  const users = await dbQuery(
    'SELECT id, username, "avatarUrl", points FROM users ORDER BY points DESC LIMIT ?',
    Math.min(Math.max(limit, 1), 100),
  );
  return okJson({ range, users });
}

export const runtime = 'nodejs';

