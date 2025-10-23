import { forbidden, notFound, okJson, unauthorized } from '@/lib/http';
import { requireUser, hasRole } from '@/lib/authz';
import { awardPoints } from '@/lib/points';
import { d1Get, d1Run } from '@/lib/cf';

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const quiz = await d1Get<any>('SELECT * FROM quizzes WHERE id = ?', ctx.params.id);
  if (!quiz) return notFound('Quiz not found');
  if (quiz.status === 'approved') return okJson({ quiz });

  await d1Run('UPDATE quizzes SET status = ? WHERE id = ?', 'approved', quiz.id);
  // 上传者加分（去重：若之前未记录）
  const exists = await d1Get<any>(
    'SELECT id FROM points_logs WHERE user_id = ? AND type = ? AND ref_id = ? LIMIT 1',
    quiz.author_id,
    'quiz_approved',
    quiz.id,
  );
  if (!exists) await awardPoints(quiz.author_id, 'quiz_approved', undefined, quiz.id);
  return okJson({ quiz: { ...quiz, status: 'approved' } });
}

export const runtime = 'nodejs';

