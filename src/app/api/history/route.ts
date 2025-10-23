import { okJson } from '@/lib/http';
import { d1All } from '@/lib/cf';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(Number(url.searchParams.get('page') || '1'), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') || '20'), 1), 50);
  const totalRow = await d1All<{ cnt: number }>('SELECT COUNT(*) as cnt FROM quiz_sets WHERE status = ?', 'public');
  const total = totalRow[0]?.cnt ?? 0;
  const items = await d1All(
    'SELECT slug, title, description, created_at as createdAt FROM quiz_sets WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    'public',
    pageSize,
    (page - 1) * pageSize,
  );
  return okJson({ items, page, pageSize, total });
}

export const runtime = 'edge';


