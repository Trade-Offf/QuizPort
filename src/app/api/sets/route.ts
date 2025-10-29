import { okJson, parseJson, unauthorized, validate } from '@/lib/http';
import { createSetSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/authz';
import { dbQuery, dbExecute } from '@/lib/db';

export async function GET() {
  const items = await dbQuery(
    'SELECT slug, title, description, "createdAt" FROM quiz_sets WHERE status = ?::"QuizSetStatus" ORDER BY "createdAt" DESC',
    'public',
  );
  return okJson({ items });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const body = await parseJson(req);
  const data = validate(createSetSchema, body);
  const id = crypto.randomUUID();
  await dbExecute(
    'INSERT INTO quiz_sets (id, slug, title, description, "authorId", "quizIds", status, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?::timestamp)',
    id,
    data.slug,
    data.title,
    data.description ?? null,
    user.id,
    JSON.stringify(data.quizIds),
    'draft',
    new Date().toISOString(),
  );
  return okJson({ set: { id, slug: data.slug, title: data.title, description: data.description, status: 'draft' } });
}

export const runtime = 'nodejs';

