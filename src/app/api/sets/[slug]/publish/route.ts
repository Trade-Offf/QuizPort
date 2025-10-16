import { prisma } from '@/lib/prisma';
import { forbidden, notFound, okJson, unauthorized } from '@/lib/http';
import { hasRole, requireUser } from '@/lib/authz';

export async function POST(_req: Request, ctx: { params: { slug: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const set = await prisma.quizSet.findUnique({ where: { slug: ctx.params.slug } });
  if (!set) return notFound('Set not found');
  if (set.authorId !== user.id && !hasRole(user, ['admin','moderator'])) return forbidden();
  const updated = await prisma.quizSet.update({ where: { id: set.id }, data: { status: 'public' } });
  return okJson({ set: updated });
}

export const runtime = 'nodejs';

