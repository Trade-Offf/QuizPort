import { forbidden, notFound, okJson, unauthorized } from '@/lib/http';
import { hasRole, requireUser } from '@/lib/authz';
import { d1Get, d1Run } from '@/lib/cf';

export async function POST(_req: Request, ctx: { params: { slug: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const set = await d1Get<any>('SELECT * FROM quiz_sets WHERE slug = ?', ctx.params.slug);
  if (!set) return notFound('Set not found');
  if (set.author_id !== user.id && !hasRole(user, ['admin','moderator'])) return forbidden();
  await d1Run('UPDATE quiz_sets SET status = ? WHERE id = ?', 'public', set.id);
  return okJson({ set: { ...set, status: 'public' } });
}

export const runtime = 'nodejs';

