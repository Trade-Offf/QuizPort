import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: (session as any).userId } });
  return user;
}

export function hasRole(user: { role: string } | null | undefined, roles: Array<'user'|'moderator'|'admin'>) {
  if (!user) return false;
  return roles.includes(user.role as any);
}

export function isAddressWhitelisted(address?: string | null): boolean {
  if (!address) return false;
  const env = process.env.WHITELIST_ADDRESSES || '';
  const list = env
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(address.toLowerCase());
}

