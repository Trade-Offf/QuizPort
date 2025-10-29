import { okJson, parseJson, unauthorized, validate, notFound } from '@/lib/http';
import { requireUser } from '@/lib/authz';
import { reportSchema } from '@/lib/schemas';
import { dbQueryOne, dbExecute } from '@/lib/db';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await ctx.params;
  const user = await requireUser();
  if (!user) return unauthorized();
  const quiz = await dbQueryOne<any>('SELECT id FROM quizzes WHERE id = ?', quizId);
  if (!quiz) return notFound('Quiz not found');
  const body = await parseJson(req);
  const data = validate(reportSchema, body);
  const id = crypto.randomUUID();
  await dbExecute(
    'INSERT INTO reports (id, "reporterId", "targetType", "targetId", reason, status, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?::timestamp)',
    id,
    user.id,
    'quiz',
    quiz.id,
    data.reason,
    'open',
    new Date().toISOString(),
  );
  return okJson({ report: { id, reporterId: user.id, targetType: 'quiz', targetId: quiz.id, reason: data.reason, status: 'open' } });
}

 

