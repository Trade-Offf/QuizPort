import { forbidden, notFound, okJson, parseJson, unauthorized } from '@/lib/http';
import { requireUser, hasRole } from '@/lib/authz';
import { d1Get, d1Run } from '@/lib/cf';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const quiz = await d1Get<any>('SELECT * FROM quizzes WHERE id = ?', ctx.params.id);
  if (!quiz) return notFound('Quiz not found');

  const body = await parseJson(req);
  const reason = (body?.reason as string) || 'Rejected';
  await d1Run('UPDATE quizzes SET status = ?, explanation = ? WHERE id = ?', 'rejected', reason, quiz.id);
  return okJson({ quiz: { ...quiz, status: 'rejected', explanation: reason } });
}

export const runtime = 'nodejs';

