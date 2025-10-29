import { forbidden, notFound, okJson, parseJson, unauthorized } from '@/lib/http';
import { hasRole, requireUser } from '@/lib/authz';
import { dbQueryOne, dbExecute } from '@/lib/db';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ['admin','moderator'])) return forbidden();

  const body = await parseJson(req);
  const action = (body?.action as 'approve'|'reject');
  const reason = (body?.reason as string) || undefined;
  const quiz = await dbQueryOne<any>('SELECT id, status FROM quizzes WHERE id = ? LIMIT 1', id);
  if (!quiz) return notFound('Quiz not found');

  if (action === 'approve') {
    await dbExecute('UPDATE quizzes SET status = ? WHERE id = ?', 'approved', quiz.id);
    return okJson({ quiz: { ...quiz, status: 'approved' } });
  } else if (action === 'reject') {
    await dbExecute('UPDATE quizzes SET status = ?, explanation = ? WHERE id = ?', 'rejected', reason ?? null, quiz.id);
    return okJson({ quiz: { ...quiz, status: 'rejected', explanation: reason ?? null } });
  } else {
    return okJson({ error: 'Invalid action' }, { status: 400 });
  }
}

 

