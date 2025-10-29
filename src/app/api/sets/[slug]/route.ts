import { notFound, okJson } from '@/lib/http';
import { dbQueryOne, dbQuery } from '@/lib/db';

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const set = await dbQueryOne<any>(
    'SELECT id, slug, title, description, "authorId", "quizIds", status, "createdAt" FROM quiz_sets WHERE slug = ?',
    slug,
  );
  if (!set || set.status === 'draft') return notFound('Set not found');
  const ids: string[] = Array.isArray(set.quizIds) ? set.quizIds : JSON.parse(set.quizIds || '[]');
  let quizzes: any[] = [];
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    quizzes = await dbQuery<any>(
      `SELECT id, "authorId", title, type, content, answer, explanation, tags, status, popularity, "createdAt" FROM quizzes WHERE id IN (${placeholders})`,
      ...ids,
    );
    quizzes = quizzes.map(q => ({
      ...q,
      content: typeof q.content === 'string' ? JSON.parse(q.content) : q.content,
      answer: typeof q.answer === 'string' ? JSON.parse(q.answer) : q.answer,
      tags: typeof q.tags === 'string' ? JSON.parse(q.tags) : (q.tags ?? []),
    }));
  }
  return okJson({ set, quizzes });
}

 

