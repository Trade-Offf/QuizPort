import { okJson, parseJson, unauthorized, validate, notFound } from '@/lib/http';
import { requireUser } from '@/lib/authz';
import { reportSchema } from '@/lib/schemas';
import { d1Get, d1Run } from '@/lib/cf';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const quiz = await d1Get<any>('SELECT id FROM quizzes WHERE id = ?', ctx.params.id);
  if (!quiz) return notFound('Quiz not found');
  const body = await parseJson(req);
  const data = validate(reportSchema, body);
  const id = crypto.randomUUID();
  await d1Run(
    'INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
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

export const runtime = 'nodejs';

