import { NextResponse } from 'next/server';
import { dbExecute } from '@/lib/db';

function randomNonce(length = 16): string {
  const bytes = Array.from(crypto.getRandomValues(new Uint8Array(length)));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST() {
  try {
    console.log('[siwe/nonce] Creating nonce...');
    const value = randomNonce(16);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    const id = crypto.randomUUID();
    console.log('[siwe/nonce] Nonce value:', value);
    console.log('[siwe/nonce] Nonce id:', id);
    await dbExecute(
      'INSERT INTO siwe_nonces (id, value, "expiresAt", "createdAt") VALUES (?, ?, ?::timestamp, ?::timestamp)',
      id,
      value,
      expiresAt.toISOString(),
      new Date().toISOString(),
    );
    console.log('[siwe/nonce] Nonce created successfully');
    return NextResponse.json({ nonce: value });
  } catch (error) {
    console.error('[siwe/nonce] Error:', error);
    return NextResponse.json({ error: 'Failed to create nonce' }, { status: 500 });
  }
}

 

