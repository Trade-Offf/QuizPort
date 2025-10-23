import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { d1Get } from '@/lib/cf';

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return null;
  }
  const row = await d1Get<{
    id: string;
    wallet_address: string | null;
    email: string | null;
    username: string;
    avatar_url: string | null;
    role: string;
    points: number;
  }>('SELECT id, wallet_address, email, username, avatar_url, role, points FROM users WHERE id = ?', (session as any).userId);
  if (!row) return null;
  return {
    id: row.id,
    walletAddress: row.wallet_address ?? undefined,
    email: row.email ?? undefined,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
    points: row.points,
  } as any;
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

