import { NextResponse } from 'next/server';
import { d1Run } from '@/lib/cf';

function randomNonce(length = 16): string {
  const bytes = Array.from(crypto.getRandomValues(new Uint8Array(length)));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST() {
  const value = randomNonce(16);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await d1Run(
    'INSERT INTO siwe_nonces (id, value, expires_at, created_at) VALUES (?, ?, ?, ?)',
    crypto.randomUUID(),
    value,
    expiresAt.toISOString(),
    new Date().toISOString(),
  );
  return NextResponse.json({ nonce: value });
}

export const runtime = 'edge';

