import { forbidden, notFound, okJson, parseJson, unauthorized } from '@/lib/http';
import { hasRole, requireUser } from '@/lib/authz';
import { d1Get, d1Run } from '@/lib/cf';

export async function POST(req: Request, ctx: any) {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const body = await parseJson(req);
  const action = (body?.action as 'approve'|'reject');
  const reason = (body?.reason as string) || undefined;
  const quiz = await d1Get<any>('SELECT id, status FROM quizzes WHERE id = ? LIMIT 1', ctx.params.id);
  if (!quiz) return notFound('Quiz not found');

  if (action === 'approve') {
    await d1Run('UPDATE quizzes SET status = ? WHERE id = ?', 'approved', quiz.id);
    return okJson({ quiz: { ...quiz, status: 'approved' } });
  } else if (action === 'reject') {
    await d1Run('UPDATE quizzes SET status = ?, explanation = ? WHERE id = ?', 'rejected', reason ?? null, quiz.id);
    return okJson({ quiz: { ...quiz, status: 'rejected', explanation: reason ?? null } });
  } else {
    return okJson({ error: 'Invalid action' }, { status: 400 });
  }
}

export const runtime = 'nodejs';

