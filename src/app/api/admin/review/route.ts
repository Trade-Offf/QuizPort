import { forbidden, okJson, unauthorized } from '@/lib/http';
import { hasRole, requireUser } from '@/lib/authz';
import { d1All } from '@/lib/cf';

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const url = new URL(req.url);
  const status = (url.searchParams.get('status') || 'pending') as 'pending'|'draft'|'approved'|'rejected';
  const items = await d1All(
    'SELECT id, author_id, title, type, content, answer, explanation, tags, status, popularity, created_at, updated_at FROM quizzes WHERE status = ? ORDER BY created_at ASC',
    status,
  );
  return okJson({ items });
}

export const runtime = 'nodejs';

