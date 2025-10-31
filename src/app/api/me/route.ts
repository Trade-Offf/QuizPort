import { requireUser, isAddressAdmin, isAddressWhitelisted } from '@/lib/authz';
import { notFound, okJson, parseJson, unauthorized } from '@/lib/http';
import { dbQueryOne, dbExecute } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    return okJson({
      user: {
        ...user,
        isAdmin: isAddressAdmin(user.walletAddress),
        isWhitelisted: isAddressWhitelisted(user.walletAddress),
      },
    });
  } catch (e: any) {
    console.error('[api/me] GET error:', e?.message || e);
    return okJson({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const body = await parseJson(req);
  const { username, avatarUrl } = body as { username?: string; avatarUrl?: string };
  const newUsername = typeof username === 'string' && username.trim() ? username.trim() : user.username;
  const newAvatar = typeof avatarUrl === 'string' ? avatarUrl : user.avatarUrl;
  await dbExecute('UPDATE users SET username = ?, "avatarUrl" = ?, "updatedAt" = ?::timestamp WHERE id = ?', newUsername, newAvatar ?? null, new Date().toISOString(), user.id);
  const updated = await dbQueryOne<any>('SELECT * FROM users WHERE id = ?', user.id);
  return okJson({ user: updated });
}

 

