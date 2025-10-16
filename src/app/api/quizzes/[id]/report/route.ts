import { prisma } from '@/lib/prisma';
import { okJson, parseJson, unauthorized, validate, notFound } from '@/lib/http';
import { requireUser } from '@/lib/authz';
import { reportSchema } from '@/lib/schemas';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const quiz = await prisma.quiz.findUnique({ where: { id: ctx.params.id } });
  if (!quiz) return notFound('Quiz not found');
  const body = await parseJson(req);
  const data = validate(reportSchema, body);
  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType: 'quiz',
      targetId: quiz.id,
      reason: data.reason,
    },
  });
  return okJson({ report });
}

export const runtime = 'nodejs';

