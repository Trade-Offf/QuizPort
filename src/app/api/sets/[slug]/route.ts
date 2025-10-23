import { notFound, okJson } from '@/lib/http';
import { d1Get, d1All } from '@/lib/cf';

export async function GET(_req: Request, ctx: { params: { slug: string } }) {
  const set = await d1Get<any>(
    'SELECT id, slug, title, description, author_id as authorId, quiz_ids as quizIds, status, created_at as createdAt FROM quiz_sets WHERE slug = ?',
    ctx.params.slug,
  );
  if (!set || set.status === 'draft') return notFound('Set not found');
  const ids: string[] = Array.isArray(set.quizIds) ? set.quizIds : JSON.parse(set.quizIds || '[]');
  let quizzes: any[] = [];
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    quizzes = await d1All<any>(
      `SELECT id, author_id as authorId, title, type, content, answer, explanation, tags, status, popularity, created_at as createdAt FROM quizzes WHERE id IN (${placeholders})`,
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

export const runtime = 'edge';

