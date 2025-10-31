import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbQueryOne } from '@/lib/db';

export async function requireUser() {
  console.log('[requireUser] Getting session...');
  const session = await getServerSession(authOptions);
  console.log('[requireUser] Session:', session ? 'exists' : 'null');
  try { console.log('[requireUser] UserId:', (session as any)?.userId); } catch {}
  
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

function normalizeAddressLoose(value?: string | null): string | null {
  if (!value) return null;
  try {
    let s = String(value).trim();
    // 可选去掉 0x/0X 前缀
    s = s.replace(/^0x/i, '');
    // 仅保留字母与数字
    s = s.replace(/[^0-9a-zA-Z]/g, '');
    if (!s) return null;
    // 统一到大写进行无大小写比较
    return s.toUpperCase();
  } catch {
    return null;
  }
}

export function isAddressWhitelisted(address?: string | null): boolean {
  const target = normalizeAddressLoose(address);
  if (!target) {
    console.log('[isAddressWhitelisted] No valid address');
    return false;
  }
  const env = process.env.WHITELIST_ADDRESSES || '';
  const list = env
    .split(',')
    .map((s) => normalizeAddressLoose(s))
    .filter((v): v is string => !!v);

  const hit = list.includes(target);
  console.log('[isAddressWhitelisted] Addr(normalized):', target);
  console.log('[isAddressWhitelisted] List(normalized):', list);
  console.log('[isAddressWhitelisted] Hit:', hit);
  return hit;
}

export function isAddressAdmin(address?: string | null): boolean {
  const target = normalizeAddressLoose(address);
  if (!target) return false;
  const env = process.env.ADMIN_ADDRESSES || '';
  const defaults = ['0x3D0f143b8Dfbd9aD3bEB719eDE3716FaDBf658D5'];
  const list = (env ? env.split(',') : defaults)
    .map((s) => normalizeAddressLoose(s))
    .filter((v): v is string => !!v);
  return list.includes(target);
}

