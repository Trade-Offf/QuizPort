import { listQuizzesQuerySchema, createQuizSchema } from '@/lib/schemas';
import { parseJson, validate, okJson, forbidden, unauthorized } from '@/lib/http';
import { requireUser } from '@/lib/authz';
import { dbQuery, dbQueryOne, dbExecute } from '@/lib/db';

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

  const filters: string[] = [];
  const binds: any[] = [];
  if (status) { filters.push('status = ?'); binds.push(status); }
  if (author) { filters.push('"authorId" = ?'); binds.push(author); }
  if (keyword) { filters.push('title LIKE ?'); binds.push(`%${keyword}%`); }
  // 简化：tags LIKE 匹配文本（D1 无 JSON 列）
  if (tagsMerged.length) { filters.push('tags LIKE ?'); binds.push(`%${tagsMerged[0]}%`); }
  const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const orderSql = sort === 'popular' ? 'ORDER BY popularity DESC' : 'ORDER BY "createdAt" DESC';
  const items = await dbQuery<any>(
    `SELECT * FROM quizzes ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    ...binds,
    pageSize,
    (page - 1) * pageSize,
  );
  const totalRow = await dbQueryOne<any>(
    `SELECT COUNT(*)::int as total FROM quizzes ${whereSql}`,
    ...binds,
  );
  const total = Number(totalRow?.total || 0);
  return okJson({ items, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const body = await parseJson(req);
  const data = validate(createQuizSchema, body);
  const id = crypto.randomUUID();
  await dbExecute(
    'INSERT INTO quizzes (id, "authorId", title, type, content, answer, explanation, tags, status, popularity, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::timestamp)',
    id,
    user.id,
    data.title,
    data.type,
    JSON.stringify(data.content ?? {}),
    JSON.stringify(data.answer ?? null),
    data.explanation ?? null,
    JSON.stringify(data.tags ?? []),
    'approved',
    0,
    new Date().toISOString(),
  );
  const created = await dbQueryOne<any>('SELECT * FROM quizzes WHERE id = ?', id);
  return okJson({ quiz: created });
}

 

