import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'QuizPort',
  description: '在线习题站，用于文章末尾跳转引流',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

