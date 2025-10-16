import { prisma } from '@/lib/prisma';
import { okJson, parseJson, unauthorized, validate } from '@/lib/http';
import { createSetSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/authz';

export async function GET() {
  const items = await prisma.quizSet.findMany({ where: { status: 'public' }, orderBy: { createdAt: 'desc' } });
  return okJson({ items });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const body = await parseJson(req);
  const data = validate(createSetSchema, body);
  const set = await prisma.quizSet.create({
    data: {
      slug: data.slug,
      title: data.title,
      description: data.description,
      authorId: user.id,
      quizIds: data.quizIds,
      status: 'draft',
    },
  });
  return okJson({ set });
}

export const runtime = 'nodejs';

