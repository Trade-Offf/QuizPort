import { prisma } from '@/lib/prisma';
import { forbidden, notFound, okJson, parseJson, unauthorized } from '@/lib/http';
import { hasRole, requireUser } from '@/lib/authz';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const body = await parseJson(req);
  const action = (body?.action as 'approve'|'reject');
  const reason = (body?.reason as string) || undefined;
  const quiz = await prisma.quiz.findUnique({ where: { id: ctx.params.id } });
  if (!quiz) return notFound('Quiz not found');

  if (action === 'approve') {
    const updated = await prisma.quiz.update({ where: { id: quiz.id }, data: { status: 'approved' } });
    return okJson({ quiz: updated });
  } else if (action === 'reject') {
    const updated = await prisma.quiz.update({ where: { id: quiz.id }, data: { status: 'rejected', explanation: reason } });
    return okJson({ quiz: updated });
  } else {
    return okJson({ error: 'Invalid action' }, { status: 400 });
  }
}

export const runtime = 'nodejs';

