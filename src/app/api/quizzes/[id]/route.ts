import { notFound, okJson, parseJson, unauthorized, forbidden, validate } from '@/lib/http';
import { updateQuizSchema } from '@/lib/schemas';
import { requireUser, hasRole } from '@/lib/authz';
import { dbQueryOne, dbExecute } from '@/lib/db';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const quiz = await dbQueryOne<any>('SELECT * FROM quizzes WHERE id = ?', id);
  if (!quiz) return notFound('Quiz not found');
  return okJson({ quiz });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return unauthorized();
  const quiz = await dbQueryOne<any>('SELECT * FROM quizzes WHERE id = ?', id);
  if (!quiz) return notFound('Quiz not found');
  if (quiz.authorId !== user.id && !hasRole(user, ['admin','moderator'])) return forbidden();

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
    await dbExecute(`UPDATE quizzes SET ${fields.join(', ')}, "updatedAt" = ?::timestamp WHERE id = ?`, ...values, new Date().toISOString(), quiz.id);
  }
  const updated = await dbQueryOne<any>('SELECT * FROM quizzes WHERE id = ?', quiz.id);
  return okJson({ quiz: updated });
}

export const runtime = 'nodejs';

