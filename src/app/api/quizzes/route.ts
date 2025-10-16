import { prisma } from '@/lib/prisma';
import { listQuizzesQuerySchema, createQuizSchema } from '@/lib/schemas';
import { parseJson, validate, okJson, forbidden, unauthorized } from '@/lib/http';
import { requireUser } from '@/lib/authz';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  // 支持 tags=tag1,tag2 或多次出现 ?tags=a&tags=b
  const tagsParams = url.searchParams.getAll('tags');
  const tagsMerged = tagsParams.flatMap((v) => v.split(',').map((s) => s.trim()).filter(Boolean));
  const { status, keyword, author, sort, page = 1, pageSize = 20 } = validate(listQuizzesQuerySchema, {
    ...query,
    tags: tagsMerged.length ? tagsMerged : undefined,
    page: Number(query.page || 1),
    pageSize: Number(query.pageSize || 20),
  });

  const where: any = {};
  if (status) where.status = status;
  if (keyword) where.title = { contains: keyword, mode: 'insensitive' };
  if (author) where.authorId = author;
  if (tagsMerged.length) where.tags = { hasSome: tagsMerged };

  const [items, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      orderBy: sort === 'popular' ? { popularity: 'desc' } : { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.quiz.count({ where }),
  ]);

  return okJson({ items, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const body = await parseJson(req);
  const data = validate(createQuizSchema, body);
  const created = await prisma.quiz.create({
    data: {
      authorId: user.id,
      title: data.title,
      type: data.type as any,
      content: data.content as any,
      answer: data.answer as any,
      explanation: data.explanation,
      tags: data.tags,
      status: 'pending',
    },
  });
  return okJson({ quiz: created });
}

export const runtime = 'nodejs';

