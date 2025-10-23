import { okJson, parseJson, unauthorized, validate } from '@/lib/http';
import { createSetSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/authz';
import { d1All, d1Run } from '@/lib/cf';

export async function GET() {
  const items = await d1All(
    'SELECT slug, title, description, created_at as createdAt FROM quiz_sets WHERE status = ? ORDER BY created_at DESC',
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
  await d1Run(
    'INSERT INTO quiz_sets (id, slug, title, description, author_id, quiz_ids, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
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

export const runtime = 'edge';

