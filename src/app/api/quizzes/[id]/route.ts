import { prisma } from '@/lib/prisma';
import { notFound, okJson, parseJson, unauthorized, forbidden, validate } from '@/lib/http';
import { updateQuizSchema } from '@/lib/schemas';
import { requireUser, hasRole } from '@/lib/authz';

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const quiz = await prisma.quiz.findUnique({ where: { id: ctx.params.id } });
  if (!quiz) return notFound('Quiz not found');
  return okJson({ quiz });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const quiz = await prisma.quiz.findUnique({ where: { id: ctx.params.id } });
  if (!quiz) return notFound('Quiz not found');
  if (quiz.authorId !== user.id && !hasRole(user, ['admin','moderator'])) return forbidden();

  const body = await parseJson(req);
  const data = validate(updateQuizSchema, body);
  const updated = await prisma.quiz.update({ where: { id: quiz.id }, data: data as any });
  return okJson({ quiz: updated });
}

export const runtime = 'nodejs';

