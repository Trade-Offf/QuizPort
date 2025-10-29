import { forbidden, notFound, okJson, unauthorized } from '@/lib/http';
import { requireUser, hasRole } from '@/lib/authz';
import { awardPoints } from '@/lib/points';
import { dbQueryOne, dbExecute } from '@/lib/db';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const quiz = await dbQueryOne<any>('SELECT * FROM quizzes WHERE id = ?', id);
  if (!quiz) return notFound('Quiz not found');
  if (quiz.status === 'approved') return okJson({ quiz });

  await dbExecute('UPDATE quizzes SET status = ? WHERE id = ?', 'approved', quiz.id);
  // 上传者加分（去重：若之前未记录）
  const exists = await dbQueryOne<any>(
    'SELECT id FROM points_logs WHERE "userId" = ? AND type = ?::"PointsLogType" AND "refId" = ? LIMIT 1',
    quiz.authorId,
    'quiz_approved',
    quiz.id,
  );
  if (!exists) await awardPoints(quiz.authorId, 'quiz_approved', undefined, quiz.id);
  return okJson({ quiz: { ...quiz, status: 'approved' } });
}

export const runtime = 'nodejs';

