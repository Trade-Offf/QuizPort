import { prisma } from '@/lib/prisma';
import { forbidden, notFound, okJson, unauthorized } from '@/lib/http';
import { requireUser, hasRole } from '@/lib/authz';
import { awardPoints } from '@/lib/points';

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const quiz = await prisma.quiz.findUnique({ where: { id: ctx.params.id } });
  if (!quiz) return notFound('Quiz not found');
  if (quiz.status === 'approved') return okJson({ quiz });

  const updated = await prisma.quiz.update({ where: { id: quiz.id }, data: { status: 'approved' } });
  // 上传者加分（去重：若之前未记录）
  const exists = await prisma.pointsLog.findFirst({ where: { userId: updated.authorId, type: 'quiz_approved', refId: updated.id } });
  if (!exists) await awardPoints(updated.authorId, 'quiz_approved', undefined, updated.id);
  return okJson({ quiz: updated });
}

export const runtime = 'nodejs';

