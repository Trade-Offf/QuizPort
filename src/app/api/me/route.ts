import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authz';
import { notFound, okJson, parseJson, unauthorized } from '@/lib/http';

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();
  return okJson({ user });
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const body = await parseJson(req);
  const { username, avatarUrl } = body as { username?: string; avatarUrl?: string };
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      username: typeof username === 'string' && username.trim() ? username.trim() : user.username,
      avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : user.avatarUrl,
    },
  });
  return okJson({ user: updated });
}

export const runtime = 'nodejs';

