import { okJson } from '@/lib/http';
import { dbQuery } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(Number(url.searchParams.get('page') || '1'), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') || '20'), 1), 50);
  const totalRow = await dbQuery<{ cnt: string }>('SELECT COUNT(*)::int as cnt FROM quiz_sets WHERE status = ?::"QuizSetStatus"', 'public');
  const total = Number(totalRow[0]?.cnt ?? 0);
  const items = await dbQuery(
    'SELECT slug, title, description, "createdAt" FROM quiz_sets WHERE status = ?::"QuizSetStatus" ORDER BY "createdAt" DESC LIMIT ? OFFSET ?',
    'public',
    pageSize,
    (page - 1) * pageSize,
  );
  return okJson({ items, page, pageSize, total });
}

export const runtime = 'nodejs';


