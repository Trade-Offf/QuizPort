import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbQueryOne } from '@/lib/db';

export async function requireUser() {
  console.log('[requireUser] Getting session...');
  const session = await getServerSession(authOptions);
  console.log('[requireUser] Session:', session ? 'exists' : 'null');
  console.log('[requireUser] Full session:', JSON.stringify(session, null, 2));
  console.log('[requireUser] UserId:', (session as any)?.userId);
  
  if (!session || !(session as any).userId) {
    console.log('[requireUser] No session or userId');
    return null;
  }
  
  const row = await dbQueryOne<{
    id: string;
    walletAddress: string | null;
    email: string | null;
    username: string;
    avatarUrl: string | null;
    role: string;
    points: number;
  }>('SELECT id, "walletAddress", email, username, "avatarUrl", role, points FROM users WHERE id = ?', (session as any).userId);
  
  console.log('[requireUser] DB Row:', row ? 'found' : 'not found');
  console.log('[requireUser] Wallet Address:', row?.walletAddress);
  
  if (!row) return null;
  return {
    id: row.id,
    walletAddress: row.walletAddress ?? undefined,
    email: row.email ?? undefined,
    username: row.username,
    avatarUrl: row.avatarUrl ?? undefined,
    role: row.role,
    points: row.points,
  } as any;
}

export function hasRole(user: { role: string } | null | undefined, roles: Array<'user'|'moderator'|'admin'>) {
  if (!user) return false;
  return roles.includes(user.role as any);
}

export function isAddressWhitelisted(address?: string | null): boolean {
  if (!address) {
    console.log('[isAddressWhitelisted] No address provided');
    return false;
  }
  const env = process.env.WHITELIST_ADDRESSES || '';
  const list = env
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  
  console.log('[isAddressWhitelisted] Address:', address.toLowerCase());
  console.log('[isAddressWhitelisted] Whitelist:', list);
  console.log('[isAddressWhitelisted] Is whitelisted:', list.includes(address.toLowerCase()));
  
  return list.includes(address.toLowerCase());
}

