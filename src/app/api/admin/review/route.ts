import { forbidden, okJson, unauthorized } from '@/lib/http';
import { hasRole, requireUser } from '@/lib/authz';
import { dbQuery } from '@/lib/db';

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const url = new URL(req.url);
  const status = (url.searchParams.get('status') || 'pending') as 'pending'|'draft'|'approved'|'rejected';
  const items = await dbQuery(
    'SELECT id, "authorId", title, type, content, answer, explanation, tags, status, popularity, "createdAt", "updatedAt" FROM quizzes WHERE status = ? ORDER BY "createdAt" ASC',
    status,
  );
  return okJson({ items });
}

export const runtime = 'nodejs';


