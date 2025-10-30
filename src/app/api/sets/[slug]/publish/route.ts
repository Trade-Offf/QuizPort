import { forbidden, notFound, okJson, unauthorized } from '@/lib/http';
import { isAddressWhitelisted, requireUser } from '@/lib/authz';
import { dbQueryOne, dbExecute } from '@/lib/db';

export async function POST(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const user = await requireUser();
  if (!user) return unauthorized();
  const set = await dbQueryOne<any>('SELECT * FROM quiz_sets WHERE slug = ?', slug);
  if (!set) return notFound('Set not found');
  // 仅白名单作者可发布
  if (!isAddressWhitelisted(user.walletAddress)) return forbidden('Not whitelisted');
  if (set.authorId !== user.id) return forbidden('Not author');
  await dbExecute('UPDATE quiz_sets SET status = ?::"QuizSetStatus" WHERE id = ?', 'public', set.id);
  return okJson({ set: { ...set, status: 'public' } });
}

 

