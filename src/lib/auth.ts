import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { SiweMessage } from 'siwe';
import { dbQueryOne, dbExecute } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      name: 'SIWE',
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(credentials) {
        try {
          console.log('[SIWE authorize] Starting authorization...');
          const message = new SiweMessage(JSON.parse(credentials?.message || '{}'));
          const domain = process.env.SIWE_DOMAIN || 'localhost';
          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000');
          console.log('[SIWE authorize] Domain:', domain, 'Expected:', message.domain);
          console.log('[SIWE authorize] URI:', nextAuthUrl.origin, 'Expected:', message.uri);
          
          const result = await message.verify({ signature: credentials?.signature || '' });
          console.log('[SIWE authorize] Verification:', result.success);

          if (!result.success) {
            console.log('[SIWE authorize] Verification failed');
            return null;
          }
          if (message.domain !== domain) {
            console.log('[SIWE authorize] Domain mismatch');
            return null;
          }
          // 在开发环境允许端口不匹配
          const actualOrigin = message.uri;
          const expectedOrigin = nextAuthUrl.origin;
          const isDev = process.env.NODE_ENV === 'development';
          
          if (actualOrigin !== expectedOrigin) {
            // 检查是否只是端口不同（开发环境常见情况）
            const actualUrl = new URL(actualOrigin);
            const expectedUrl = new URL(expectedOrigin);
            const isOnlyPortDiff = actualUrl.hostname === expectedUrl.hostname && 
                                  actualUrl.protocol === expectedUrl.protocol &&
                                  actualUrl.pathname === expectedUrl.pathname;
            
            if (isDev && isOnlyPortDiff) {
              console.log('[SIWE authorize] Port mismatch allowed in dev mode');
            } else {
              console.log('[SIWE authorize] URI mismatch');
              return null;
            }
          }

          const nonce = message.nonce;
          console.log('[SIWE authorize] Checking nonce:', nonce);
          const record = await dbQueryOne<{ value: string; expiresAt: string }>(
            'SELECT value, "expiresAt" FROM siwe_nonces WHERE value = ?',
            nonce,
          );
          console.log('[SIWE authorize] Nonce record:', record ? 'found' : 'not found');
          if (!record) return null;
          if (new Date(record.expiresAt) < new Date()) {
            console.log('[SIWE authorize] Nonce expired');
            return null;
          }
          await dbExecute('DELETE FROM siwe_nonces WHERE value = ?', nonce);
          console.log('[SIWE authorize] Nonce deleted');

          const address = message.address.toLowerCase();
          console.log('[SIWE authorize] Wallet address:', address);
          let user = await dbQueryOne<{ id: string; username: string; email?: string | null; avatarUrl?: string | null }>(
            'SELECT id, username, email, "avatarUrl" FROM users WHERE "walletAddress" = ?',
            address,
          );
          console.log('[SIWE authorize] User from DB:', user ? 'found' : 'not found');
          if (!user) {
            console.log('[SIWE authorize] Creating new user...');
            const id = crypto.randomUUID();
            const username = `user_${address.slice(2, 8)}`;
            await dbExecute(
              'INSERT INTO users (id, "walletAddress", username, "createdAt") VALUES (?, ?, ?, ?)',
              id,
              address,
              username,
              new Date().toISOString(),
            );
            user = { id, username, email: null as any, avatarUrl: null as any };
            console.log('[SIWE authorize] User created:', id);
          }

          console.log('[SIWE authorize] Returning user:', user.id);
          return {
            id: user.id,
            name: user.username,
            image: user.avatarUrl || undefined,
            email: user.email || undefined,
          };
        } catch (e) {
          console.error('[SIWE authorize] Error:', e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) {
        (session as any).userId = token.userId;
      }
      return session;
    },
  },
};

