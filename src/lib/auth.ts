import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { SiweMessage } from 'siwe';
import { d1Get, d1Run } from '@/lib/cf';

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
          const message = new SiweMessage(JSON.parse(credentials?.message || '{}'));
          const domain = process.env.SIWE_DOMAIN || 'localhost';
          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000');
          const result = await message.verify({ signature: credentials?.signature || '' });

          if (!result.success) return null;
          if (message.domain !== domain) return null;
          if (message.uri !== nextAuthUrl.origin) return null;

          const nonce = message.nonce;
          const record = await d1Get<{ value: string; expires_at: string }>(
            'SELECT value, expires_at FROM siwe_nonces WHERE value = ?',
            nonce,
          );
          if (!record) return null;
          if (new Date(record.expires_at) < new Date()) return null;
          await d1Run('DELETE FROM siwe_nonces WHERE value = ?', nonce);

          const address = message.address.toLowerCase();
          let user = await d1Get<{ id: string; username: string; email?: string | null; avatar_url?: string | null }>(
            'SELECT id, username, email, avatar_url FROM users WHERE wallet_address = ?',
            address,
          );
          if (!user) {
            const id = crypto.randomUUID();
            const username = `user_${address.slice(2, 8)}`;
            await d1Run(
              'INSERT INTO users (id, wallet_address, username, created_at) VALUES (?, ?, ?, ?)',
              id,
              address,
              username,
              new Date().toISOString(),
            );
            user = { id, username, email: null as any, avatar_url: null as any };
          }

          return {
            id: user.id,
            name: user.username,
            image: user.avatar_url || undefined,
            email: user.email || undefined,
          };
        } catch (e) {
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

