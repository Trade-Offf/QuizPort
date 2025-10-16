import { prisma } from '@/lib/prisma';
import { forbidden, okJson, unauthorized } from '@/lib/http';
import { hasRole, requireUser } from '@/lib/authz';

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const url = new URL(req.url);
  const status = (url.searchParams.get('status') || 'pending') as 'pending'|'draft'|'approved'|'rejected';
  const items = await prisma.quiz.findMany({ where: { status }, orderBy: { createdAt: 'asc' } });
  return okJson({ items });
}

export const runtime = 'nodejs';

