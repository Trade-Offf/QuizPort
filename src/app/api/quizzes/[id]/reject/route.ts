import { prisma } from '@/lib/prisma';
import { forbidden, notFound, okJson, parseJson, unauthorized } from '@/lib/http';
import { requireUser, hasRole } from '@/lib/authz';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const quiz = await prisma.quiz.findUnique({ where: { id: ctx.params.id } });
  if (!quiz) return notFound('Quiz not found');

  const body = await parseJson(req);
  const reason = (body?.reason as string) || 'Rejected';
  const updated = await prisma.quiz.update({ where: { id: quiz.id }, data: { status: 'rejected', explanation: reason } });
  return okJson({ quiz: updated });
}

export const runtime = 'nodejs';

