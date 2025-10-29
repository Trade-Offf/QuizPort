import { forbidden, notFound, okJson, parseJson, unauthorized } from '@/lib/http';
import { requireUser, hasRole } from '@/lib/authz';
import { dbQueryOne, dbExecute } from '@/lib/db';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const quiz = await dbQueryOne<any>('SELECT * FROM quizzes WHERE id = ?', id);
  if (!quiz) return notFound('Quiz not found');

  const body = await parseJson(req);
  const reason = (body?.reason as string) || 'Rejected';
  await dbExecute('UPDATE quizzes SET status = ?, explanation = ? WHERE id = ?', 'rejected', reason, quiz.id);
  return okJson({ quiz: { ...quiz, status: 'rejected', explanation: reason } });
}

 

