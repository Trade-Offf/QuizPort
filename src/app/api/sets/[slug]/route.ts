import { prisma } from '@/lib/prisma';
import { notFound, okJson } from '@/lib/http';

export async function GET(_req: Request, ctx: { params: { slug: string } }) {
  const set = await prisma.quizSet.findUnique({ where: { slug: ctx.params.slug } });
  if (!set || set.status === 'draft') return notFound('Set not found');
  const quizzes = await prisma.quiz.findMany({ where: { id: { in: set.quizIds } } });
  return okJson({ set, quizzes });
}

export const runtime = 'nodejs';

