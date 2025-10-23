import { notFound, okJson, parseJson, unauthorized, forbidden, validate } from '@/lib/http';
import { updateQuizSchema } from '@/lib/schemas';
import { requireUser, hasRole } from '@/lib/authz';
import { d1Get, d1Run } from '@/lib/cf';

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const quiz = await d1Get<any>('SELECT * FROM quizzes WHERE id = ?', ctx.params.id);
  if (!quiz) return notFound('Quiz not found');
  return okJson({ quiz });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const quiz = await d1Get<any>('SELECT * FROM quizzes WHERE id = ?', ctx.params.id);
  if (!quiz) return notFound('Quiz not found');
  if (quiz.author_id !== user.id && !hasRole(user, ['admin','moderator'])) return forbidden();

  const body = await parseJson(req);
  const data = validate(updateQuizSchema, body);
  // 仅允许部分字段更新
  const fields: string[] = [];
  const values: any[] = [];
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.content !== undefined) { fields.push('content = ?'); values.push(JSON.stringify(data.content)); }
  if (data.answer !== undefined) { fields.push('answer = ?'); values.push(JSON.stringify(data.answer)); }
  if (data.explanation !== undefined) { fields.push('explanation = ?'); values.push(data.explanation ?? null); }
  if (data.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(data.tags)); }
  if (fields.length) {
    await d1Run(`UPDATE quizzes SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`, ...values, new Date().toISOString(), quiz.id);
  }
  const updated = await d1Get<any>('SELECT * FROM quizzes WHERE id = ?', quiz.id);
  return okJson({ quiz: updated });
}

export const runtime = 'nodejs';

