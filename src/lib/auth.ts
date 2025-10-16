import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { SiweMessage } from 'siwe';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
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
          const record = await prisma.siweNonce.findUnique({ where: { value: nonce } });
          if (!record) return null;
          if (record.expiresAt < new Date()) return null;

          // consume nonce
          await prisma.siweNonce.delete({ where: { value: nonce } });

          const address = message.address.toLowerCase();
          const user = await prisma.user.upsert({
            where: { walletAddress: address },
            update: {},
            create: {
              walletAddress: address,
              username: `user_${address.slice(2, 8)}`,
            },
          });

          return {
            id: user.id,
            name: user.username,
            image: user.avatarUrl || undefined,
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

